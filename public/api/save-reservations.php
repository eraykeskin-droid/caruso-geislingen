<?php
// save-reservations.php
header('Content-Type: application/json');
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
    foreach ($input as $res) {
        if (!empty($res['id'])) {
            $incomingIds[] = $res['id'];

            if (in_array($res['id'], $existingIds)) {
                $stmt = $pdo->prepare("UPDATE reservations SET status = ?, name = ?, email = ?, phone = ?, guests = ?, date = ?, time = ?, comment = ? WHERE id = ?");
                $stmt->execute([
                    $res['status'],
                    $res['name'],
                    $res['email'],
                    $res['phone'],
                    $res['guests'],
                    $res['date'],
                    $res['time'],
                    $res['comment'] ?? '',
                    $res['id']
                ]);
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