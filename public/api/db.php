<?php
// db.php - MySQL Connection

// Load configuration if exists (e.g. from config.php or environment)
$config = include(__DIR__ . '/../../config.php');

$host = 'localhost'; // Adjust for IONOS if necessary
$db = 'caruso_db';
$user = 'caruso_user';
$pass = $config['mail_password'] ?? ''; // Reusing for DB if same, or adjust
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
}
catch (\PDOException $e) {
    // For development, we might want to see the error. In production, log it.
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}
?>
