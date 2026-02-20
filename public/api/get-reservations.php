<?php
// get-reservations.php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Auto-cleanup: Delete reservations older than 2 days
    $pdo->query("DELETE FROM reservations WHERE date < DATE_SUB(CURDATE(), INTERVAL 2 DAY)");

    $stmt = $pdo->query("SELECT * FROM reservations ORDER BY date DESC, time ASC");
    $reservations = $stmt->fetchAll();
    echo json_encode($reservations);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>