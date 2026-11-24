<?php
// ============================================================
// logout.php — end the admin session
//
//   POST /logout.php
//
// Destroys the PHP session created by login.php, so the admin
// must log in again before using protected endpoints.
// ============================================================
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed. Use POST.', 405);
}

// Clear the session data and the session cookie.
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}
session_destroy();

jsonResponse(['ok' => true, 'message' => 'Logged out.']);
