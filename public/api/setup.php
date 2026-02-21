<?php
require_once 'db.php';

try {
    // Categories Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_special TINYINT(1) DEFAULT 0,
        bg_color VARCHAR(50) DEFAULT '#000000',
        badge_text VARCHAR(100) DEFAULT 'Spezial',
        order_index INT DEFAULT 0
    )");

    // Items Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) DEFAULT '',
        info TEXT,
        allergens VARCHAR(255) DEFAULT '',
        order_index INT DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )");

    // Reservations Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS reservations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        guests INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        comment TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    echo "Database setup successful. Tables created.";
}
catch (Exception $e) {
    echo "Setup error: " . $e->getMessage();
}
?>