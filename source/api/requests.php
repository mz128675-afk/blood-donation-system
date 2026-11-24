<?php
// ============================================================
// requests.php — blood requests: list, create, update status
//
//   GET  /requests.php                    — list all requests (ADMIN ONLY)
//   GET  /requests.php?status=Pending     — only pending requests (ADMIN ONLY)
//   POST /requests.php                     — create a new request (public)
//        body (JSON): patient_name, blood_group, city,
//                     hospital, urgency (Normal/Urgent/Critical)
//   PUT  /requests.php                     — change a request's status (ADMIN ONLY)
//        body (JSON): id, status (Pending/Fulfilled)
//   POST /requests.php?action=update_status — same as PUT, for
//        servers that block PUT requests (same JSON body, ADMIN ONLY)
//
// Admin-only endpoints call requireAdmin(): they check the PHP
// session set by login.php, so a stranger cannot list requests
// or change a status without logging in first.
//
// Validation: every input is checked here (never trust the
// frontend alone). Bad input gets a 400 with field-specific
// errors, for example:
//   { "ok": false, "error": "Please fix the highlighted fields.",
//     "errors": { "hospital": "Hospital is required." } }
// ============================================================
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---------- GET: list requests — ADMIN ONLY ----------
if ($method === 'GET') {
    requireAdmin();

    $status = $_GET['status'] ?? '';

    // If a status filter is given, it must be a real status.
    if ($status !== '' && !in_array($status, ['Pending', 'Fulfilled'], true)) {
        jsonError('Invalid status. Use Pending or Fulfilled.', 400);
    }

    $sql    = 'SELECT id, patient_name, blood_group, city, hospital, urgency, status, created_at FROM blood_requests WHERE 1 = 1';
    $params = [];

    if ($status !== '') {
        $sql .= ' AND status = ?';
        $params[] = $status;
    }
    $sql .= ' ORDER BY created_at DESC';

    try {
        $stmt = getDb()->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll();
        jsonResponse(['ok' => true, 'requests' => $requests, 'count' => count($requests)]);
    } catch (PDOException $e) {
        dbError($e);
    }
}

// ---------- PUT / POST?action=update_status: change status — ADMIN ONLY ----------
$isStatusUpdate = ($method === 'PUT')
    || ($method === 'POST' && ($_GET['action'] ?? '') === 'update_status');

if ($isStatusUpdate) {
    requireAdmin();

    $data   = readJsonBody();
    $id     = (int) ($data['id'] ?? 0);
    $status = trim($data['status'] ?? '');

    $errors = [];
    if ($id <= 0) {
        $errors['id'] = 'A valid request id is required.';
    }
    if ($status === '') {
        $errors['status'] = 'Please select a status.';
    } elseif (!in_array($status, ['Pending', 'Fulfilled'], true)) {
        $errors['status'] = 'Invalid status. Use Pending or Fulfilled.';
    }
    if (count($errors) > 0) {
        jsonError('Please fix the highlighted fields.', 400, $errors);
    }

    try {
        $stmt = getDb()->prepare('UPDATE blood_requests SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);

        if ($stmt->rowCount() === 0) {
            jsonError('No request found with that id.', 404);
        }
        jsonResponse(['ok' => true, 'message' => 'Request status updated to ' . $status . '.']);
    } catch (PDOException $e) {
        dbError($e);
    }
}

// ---------- POST: create a new blood request (public) ----------
if ($method === 'POST') {
    $data = readJsonBody();

    $patientName = trim($data['patient_name'] ?? '');
    $bloodGroup  = trim($data['blood_group'] ?? '');
    $city        = trim($data['city'] ?? '');
    $hospital    = trim($data['hospital'] ?? '');
    $urgency     = trim($data['urgency'] ?? '');

    // --- Validate every field, collect field-specific errors ---
    $errors = [];

    if ($patientName === '') {
        $errors['patient_name'] = 'Patient name is required.';
    } elseif (mb_strlen($patientName) < 3) {
        $errors['patient_name'] = 'Patient name must be at least 3 characters.';
    }

    if ($bloodGroup === '') {
        $errors['blood_group'] = 'Please select a blood group.';
    } elseif (!in_array($bloodGroup, validBloodGroups(), true)) {
        $errors['blood_group'] = 'Invalid blood group. Use one of: A+, A-, B+, B-, O+, O-, AB+, AB-.';
    }

    if ($city === '') {
        $errors['city'] = 'City is required.';
    }

    if ($hospital === '') {
        $errors['hospital'] = 'Hospital is required.';
    }

    if ($urgency === '') {
        $errors['urgency'] = 'Please select an urgency.';
    } elseif (!in_array($urgency, ['Normal', 'Urgent', 'Critical'], true)) {
        $errors['urgency'] = 'Invalid urgency. Use Normal, Urgent or Critical.';
    }

    if (count($errors) > 0) {
        jsonError('Please fix the highlighted fields.', 400, $errors);
    }

    try {
        $stmt = getDb()->prepare(
            'INSERT INTO blood_requests (patient_name, blood_group, city, hospital, urgency, status)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$patientName, $bloodGroup, $city, $hospital, $urgency, 'Pending']);
        $newId = (int) getDb()->lastInsertId();
        jsonResponse(
            ['ok' => true, 'message' => 'Blood request sent. Status: Pending.', 'id' => $newId],
            201
        );
    } catch (PDOException $e) {
        dbError($e);
    }
}

// Any other method is not supported here.
jsonError('Method not allowed. Use GET, POST or PUT.', 405);
