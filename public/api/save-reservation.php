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
    $isUpdate = false;

    // Check if it already exists
    if (!empty($input['id'])) {
        $stmt = $pdo->prepare("SELECT id FROM reservations WHERE id = ?");
        $stmt->execute([$input['id']]);
        if ($stmt->fetch()) {
            $isUpdate = true;
        }
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
            $input['comment'] ?? '',
            $input['id']
        ]);
    }
    else {
        $externalId = !empty($input['id']) ? $input['id'] : 'C' . str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO reservations (id, name, email, phone, guests, date, time, comment, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $externalId,
            $input['name'],
            $input['email'],
            $input['phone'],
            $input['guests'],
            $input['date'],
            $input['time'],
            $input['comment'] ?? '',
            $input['status'] ?? 'pending',
            $input['created_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    // Trigger email notifications
    require_once 'mail.php';
    $adminMailSent = sendReservationMail($input, 'ADMIN_NOTIFICATION');
    $customerMailSent = sendReservationMail($input, 'CUSTOMER_RECEIPT');

    echo json_encode([
        'success' => true,
        'mail_admin' => $adminMailSent,
        'mail_customer' => $customerMailSent
    ]);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>