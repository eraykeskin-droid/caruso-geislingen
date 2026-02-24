<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? trim($input['password']) : '';

// Debug logging (will be in PHP error log)
// error_log("Login attempt with password: " . $password);

if ($password === 'Luca2022!') {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_role'] = 'admin';
    echo json_encode(['success' => true, 'role' => 'admin']);
}
else if ($password === 'lucabesterchef') {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_role'] = 'staff';
    echo json_encode(['success' => true, 'role' => 'staff']);
}
else {
    // error_log("Login failed for: " . $password);
    echo json_encode(['success' => false, 'error' => 'Falsches Passwort']);
}
?>