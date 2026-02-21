<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$password = $input['password'] ?? '';

if ($password === 'Caruso2024!') {
    $_SESSION['admin_logged_in'] = true;
    echo json_encode(['success' => true]);
}
else {
    echo json_encode(['success' => false, 'error' => 'Falsches Passwort']);
}
?>