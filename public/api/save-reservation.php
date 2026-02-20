<?php
// save-reservation.php
header('Content-Type: application/json');
require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'No data provided']);
    exit;
}

try {
    // Check if it's an update (has ID) or new
    $isUpdate = isset($input['id_pk']); // Internal PK

    if (isset($input['id']) && !$isUpdate) {
        // Checking for existing external ID (C4012 style)
        $stmt = $pdo->prepare("SELECT id FROM reservations WHERE id = ?");
        $stmt->execute([$input['id']]);
        $exists = $stmt->fetch();
        if ($exists)
            $isUpdate = true;
    }

    if ($isUpdate) {
        $stmt = $pdo->prepare("UPDATE reservations SET status = ?, name = ?, email = ?, phone = ?, guests = ?, date = ?, time = ?, comment = ? WHERE id = ?");
        $stmt->execute([
            $input['status'] ?? 'pending',
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['guests'],
            $input['date'],
            $input['time'],
            $input['comment'],
            $input['id']
        ]);
    }
    else {
        // Generate external ID if not provided
        $externalId = $input['id'] ?? 'C' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO reservations (id, name, email, phone, guests, date, time, comment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $externalId,
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['guests'],
            $input['date'],
            $input['time'],
            $input['comment'],
            'pending'
        ]);
    }

    echo json_encode(['success' => true]);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>