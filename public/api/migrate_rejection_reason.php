<?php
require_once 'db.php';

try {
    $pdo->exec("ALTER TABLE reservations ADD COLUMN rejection_reason TEXT AFTER status");
    echo "Success: rejection_reason column added.";
}
catch (Exception $e) {
    echo "Error or already exists: " . $e->getMessage();
}
?>