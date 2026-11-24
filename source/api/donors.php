<?php
// ============================================================
// donors.php — donor list, search and registration
//
//   GET  /donors.php                       — list all donors (public)
//   GET  /donors.php?blood_group=O+       — donors with O+ blood
//   GET  /donors.php?city=Gujrat          — donors in Gujrat
//   GET  /donors.php?blood_group=O+&city=Gujrat — both filters
//   POST /donors.php                       — register a new donor
//        body (JSON): name, blood_group, city, phone,
//                     last_donation_date (optional)
//
// Validation: every input is checked here (never trust the
// frontend alone). Bad input gets a 400 with field-specific
// errors, for example:
//   { "ok": false, "error": "Please fix the highlighted fields.",
//     "errors": { "phone": "Phone must look like 03XX-XXXXXXX." } }
// ============================================================
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ---------- GET: list / search donors (public) ----------
if ($method === 'GET') {
    $bloodGroup = $_GET['blood_group'] ?? '';
    $city       = trim($_GET['city'] ?? '');

    // If a blood group is given, it must be a real one.
    if ($bloodGroup !== '' && !in_array($bloodGroup, validBloodGroups(), true)) {
        jsonError('Invalid blood group. Use one of: A+, A-, B+, B-, O+, O-, AB+, AB-', 400);
    }

    // Build the query with placeholders only — never put user
    // input directly into the SQL string (prevents SQL injection).
    $sql    = 'SELECT id, name, blood_group, city, phone, last_donation_date, created_at FROM donors WHERE 1 = 1';
    $params = [];

    if ($bloodGroup !== '') {
        $sql .= ' AND blood_group = ?';
        $params[] = $bloodGroup;
    }
    if ($city !== '') {
        $sql .= ' AND city LIKE ?'; // LIKE lets "guj" match "Gujrat"
        $params[] = '%' . $city . '%';
    }
    $sql .= ' ORDER BY created_at DESC';

    try {
        $stmt = getDb()->prepare($sql);
        $stmt->execute($params);
        $donors = $stmt->fetchAll();
        jsonResponse(['ok' => true, 'donors' => $donors, 'count' => count($donors)]);
    } catch (PDOException $e) {
        dbError($e);
    }
}

// ---------- POST: register a new donor ----------
if ($method === 'POST') {
    $data = readJsonBody();

    $name             = trim($data['name'] ?? '');
    $bloodGroup       = trim($data['blood_group'] ?? '');
    $city             = trim($data['city'] ?? '');
    $phone            = trim($data['phone'] ?? '');
    $lastDonationDate = trim($data['last_donation_date'] ?? '');

    // --- Validate every field, collect field-specific errors ---
    $errors = [];

    if ($name === '') {
        $errors['name'] = 'Name is required.';
    } elseif (mb_strlen($name) < 3) {
        $errors['name'] = 'Name must be at least 3 characters.';
    }

    if ($bloodGroup === '') {
        $errors['blood_group'] = 'Please select a blood group.';
    } elseif (!in_array($bloodGroup, validBloodGroups(), true)) {
        $errors['blood_group'] = 'Invalid blood group. Use one of: A+, A-, B+, B-, O+, O-, AB+, AB-.';
    }

    if ($city === '') {
        $errors['city'] = 'City is required.';
    }

    if ($phone === '') {
        $errors['phone'] = 'Phone is required.';
    } elseif (!isValidPhone($phone)) {
        $errors['phone'] = 'Phone must be a Pakistani mobile: 03XX-XXXXXXX (11 digits starting with 03).';
    }

    if ($lastDonationDate !== '') {
        if (!isValidDateString($lastDonationDate)) {
            $errors['last_donation_date'] = 'Date must look like YYYY-MM-DD, for example 2026-08-15.';
        } elseif (isFutureDate($lastDonationDate)) {
            $errors['last_donation_date'] = 'Last donation date cannot be in the future.';
        } elseif (!isEligibleDonor($lastDonationDate)) {
            $errors['last_donation_date'] = 'Not eligible yet — you can donate again 3 months after your last donation.';
        }
    }

    if (count($errors) > 0) {
        jsonError('Please fix the highlighted fields.', 400, $errors);
    }

    try {
        $stmt = getDb()->prepare(
            'INSERT INTO donors (name, blood_group, city, phone, last_donation_date)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $name,
            $bloodGroup,
            $city,
            $phone,
            $lastDonationDate === '' ? null : $lastDonationDate,
        ]);
        $newId = (int) getDb()->lastInsertId();
        jsonResponse(
            ['ok' => true, 'message' => 'Donor registered. Thank you!', 'id' => $newId],
            201
        );
    } catch (PDOException $e) {
        dbError($e);
    }
}

// Any other method (PUT, DELETE...) is not supported here.
jsonError('Method not allowed. Use GET to list donors or POST to register one.', 405);
