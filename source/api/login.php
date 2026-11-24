<?php
// ============================================================
// login.php — admin login
//
//   POST /login.php
//        body (JSON): username, password
//
// Checks the username and password against the users table.
// Passwords are stored as bcrypt hashes, so we check with
// password_verify() — plain-text passwords are never compared
// or stored.
//
// On success a PHP session is created (a new session id, so an
// old stolen session id cannot be reused) and the username is
// saved in $_SESSION['admin']. Protected endpoints check that
// session with requireAdmin().
//
// Success answer: { "ok": true, "username": "admin", "role": "admin" }
// Wrong login:    { "ok": false, "error": "Wrong username or password." }
//
// NOTE: this is a simple login for a student project — there is
// no JWT or token. It is meant for local / demo use only.
// ============================================================
require __DIR__ . '/config.php';

// GET /login.php — who is logged in right now?
// The admin dashboard calls this on load: if the PHP session
// has an admin, the dashboard opens; otherwise it shows the
// login form. The server (not the browser) decides.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!empty($_SESSION['admin'])) {
        jsonResponse(['ok' => true, 'username' => $_SESSION['admin'], 'role' => 'admin']);
    }
    jsonError('Not logged in.', 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST with username and password.', 405);
}

$data     = readJsonBody();
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// Field-specific errors (the frontend shows them next to the field).
$errors = [];
if ($username === '') {
    $errors['username'] = 'Username is required.';
}
if ($password === '') {
    $errors['password'] = 'Password is required.';
}
if (count($errors) > 0) {
    jsonError('Please fix the highlighted fields.', 400, $errors);
}

try {
    $stmt = getDb()->prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Wrong username, or password does not match the stored hash.
    // (Same message for both, so an attacker cannot tell which one was wrong.)
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonError('Wrong username or password.', 401);
    }

    // New session id after login (prevents session fixation).
    session_regenerate_id(true);
    $_SESSION['admin'] = $user['username'];

    jsonResponse([
        'ok'       => true,
        'message'  => 'Login successful. Welcome, ' . $user['username'] . '!',
        'username' => $user['username'],
        'role'     => $user['role'],
    ]);
} catch (PDOException $e) {
    dbError($e);
}
