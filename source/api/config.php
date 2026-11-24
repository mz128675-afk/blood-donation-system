<?php
// ============================================================
// config.php — database connection + shared helpers
// Plain PHP, no framework. Uses PDO with prepared statements,
// so user input can never break the SQL (SQL-injection safe).
//
// SECURITY NOTES:
// - Database credentials live ONLY here (XAMPP defaults for
//   local use). No other file has credentials.
// - Admin actions use a PHP session: login.php sets
//   $_SESSION['admin']; protected endpoints call requireAdmin().
// - Errors sent to the client are generic — the real database
//   error is written to the server log only (error_log).
// - CORS allows ONLY the frontend origin below, not "*".
// ============================================================

// --- Database settings (XAMPP defaults) ---
// On XAMPP: host = localhost, database = blood_donation,
// username = root, password = empty.
define('DB_HOST', 'localhost');
define('DB_NAME', 'blood_donation');
define('DB_USER', 'root');
define('DB_PASS', '');

// --- The ONE frontend origin allowed to call this API ---
// React dev server. If you deploy the frontend somewhere else,
// change this to that site's origin (example: https://mz128675-afk.github.io).
define('ALLOWED_ORIGIN', 'http://localhost:5173');

// --- Start the session (needed for the admin login) ---
// Must run before any output. The session cookie is HttpOnly
// (JavaScript cannot read it) and SameSite=Lax.
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

// --- CORS: let ONLY the frontend origin talk to this API ---
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Answer preflight (OPTIONS) requests and stop here.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Connect to MySQL with PDO ---
function getDb() {
    static $pdo = null; // connect once, reuse the same connection
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // errors throw exceptions
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // rows come back as arrays
        ]);
    }
    return $pdo;
}

// --- Send a JSON answer and stop ---
// Example: jsonResponse(['ok' => true, 'donors' => $rows], 200);
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// --- Send a JSON error and stop ---
// Example: jsonError('Blood group is missing', 400).
// $fieldErrors is an optional map like ['phone' => 'Phone must look like 03XX-XXXXXXX.']
function jsonError($message, $statusCode = 400, $fieldErrors = null) {
    $body = ['ok' => false, 'error' => $message];
    if (is_array($fieldErrors) && count($fieldErrors) > 0) {
        $body['errors'] = $fieldErrors;
    }
    jsonResponse($body, $statusCode);
}

// --- Log the real error, tell the client something generic ---
// Never send raw database errors or stack traces to the client.
function dbError(PDOException $e) {
    error_log('Blood Donation API database error: ' . $e->getMessage());
    jsonError('Something went wrong. Please try again later.', 500);
}

// --- Require an admin login (call at the top of admin-only endpoints) ---
function requireAdmin() {
    if (empty($_SESSION['admin'])) {
        jsonError('Admin login required.', 401);
    }
}

// --- Read the JSON body of POST / PUT requests ---
// Returns an array (empty array if the body is not valid JSON).
function readJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// --- The 8 valid blood groups (used for validation) ---
function validBloodGroups() {
    return ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
}

// --- Pakistani mobile check: 11 digits starting with 03 ---
// Accepts "0301-2345678" or "03012345678" (dash and spaces ignored).
function isValidPhone($phone) {
    $digits = preg_replace('/\D/', '', (string) $phone);
    return preg_match('/^03\d{9}$/', $digits) === 1;
}

// --- Date check: must look like YYYY-MM-DD and be a real date ---
function isValidDateString($date) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
        return false;
    }
    [$y, $m, $d] = array_map('intval', explode('-', $date));
    return checkdate($m, $d, $y);
}

// --- Is this date in the future? ---
function isFutureDate($date) {
    return $date > date('Y-m-d');
}

// --- Can this person donate? Last donation must be 3+ months ago ---
// Returns true when there is no date yet (never donated) or the
// last donation was at least 3 months ago.
function isEligibleDonor($lastDonationDate) {
    if ($lastDonationDate === '' || $lastDonationDate === null) {
        return true;
    }
    $threeMonthsAgo = (new DateTime())->modify('-3 months')->format('Y-m-d');
    return $lastDonationDate <= $threeMonthsAgo;
}
