<?php
// save-reservations.php
header('Content-Type: application/json');
require_once 'auth-helper.php';
requireLogin(['admin', 'staff']);
require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Get all existing reservation IDs
    $stmt = $pdo->query("SELECT id FROM reservations");
    $existingIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $incomingIds = [];

    // For bulk save, just loop through and UPDATE all given records
    require_once 'mail.php';
    foreach ($input as $res) {
        if (!empty($res['id'])) {
            $incomingIds[] = $res['id'];

            if (in_array($res['id'], $existingIds)) {
                // Fetch current status to detect change
                $stmt = $pdo->prepare("SELECT status FROM reservations WHERE id = ?");
                $stmt->execute([$res['id']]);
                $oldStatus = $stmt->fetchColumn();

                $stmt = $pdo->prepare("UPDATE reservations SET status = ?, rejection_reason = ?, name = ?, email = ?, phone = ?, guests = ?, date = ?, time = ?, comment = ? WHERE id = ?");
                $stmt->execute([
                    $res['status'],
                    $res['rejection_reason'] ?? null,
                    $res['name'],
                    $res['email'],
                    $res['phone'],
                    $res['guests'],
                    $res['date'],
                    $res['time'],
                    $res['comment'] ?? '',
                    $res['id']
                ]);

                // If status changed to confirmed/rejected, send mail
                if ($oldStatus !== $res['status']) {
                    if ($res['status'] === 'confirmed') {
                        sendReservationMail($res, 'CUSTOMER_CONFIRMED');
                    }
                    else if ($res['status'] === 'rejected') {
                        sendReservationMail($res, 'CUSTOMER_REJECTED');
                    }
                }
            }
        }
    }

    // Delete missing reservations (deletion via admin panel)
    $missingIds = array_diff($existingIds, $incomingIds);
    if (!empty($missingIds)) {
        $placeholders = implode(',', array_fill(0, count($missingIds), '?'));
        $stmtDel = $pdo->prepare("DELETE FROM reservations WHERE id IN ($placeholders)");
        $stmtDel->execute(array_values($missingIds));
    }

    $pdo->commit();
    echo json_encode(['success' => true]);
}
catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>