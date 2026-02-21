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

    // Subcategories Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS subcategories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        order_index INT DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
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

    // Opening Hours Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS opening_hours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_name VARCHAR(50) NOT NULL UNIQUE,
        hours VARCHAR(255) NOT NULL,
        order_index INT DEFAULT 0
    )");

    // Website Settings Table (for Contact Info etc.)
    $pdo->exec("CREATE TABLE IF NOT EXISTS website_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
    )");

    // Gallery Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        src VARCHAR(255) NOT NULL,
        alt VARCHAR(255),
        description VARCHAR(255) DEFAULT '',
        span VARCHAR(50) DEFAULT '',
        order_index INT DEFAULT 0
    )");

    // Migration: Add description column if it doesn't exist
    try {
        $pdo->exec("ALTER TABLE gallery_images ADD COLUMN description VARCHAR(255) DEFAULT '' AFTER alt");
    }
    catch (Exception $e) {
    // Column likely already exists, ignore
    }

    // Seed default data if empty
    $count = $pdo->query("SELECT COUNT(*) FROM opening_hours")->fetchColumn();
    if ($count == 0) {
        $days = [
            ['Montag', '18:00 - 00:00 Uhr', 0],
            ['Dienstag', '18:00 - 00:00 Uhr', 1],
            ['Mittwoch', '18:00 - 00:00 Uhr', 2],
            ['Donnerstag', '18:00 - 00:00 Uhr', 3],
            ['Freitag', '18:00 - 03:00 Uhr', 4],
            ['Samstag', '14:00 - 03:00 Uhr', 5],
            ['Sonntag', '14:00 - 00:00 Uhr', 6]
        ];
        $stmt = $pdo->prepare("INSERT INTO opening_hours (day_name, hours, order_index) VALUES (?, ?, ?)");
        foreach ($days as $day) {
            $stmt->execute($day);
        }
    }

    $count = $pdo->query("SELECT COUNT(*) FROM website_settings")->fetchColumn();
    if ($count == 0) {
        $settings = [
            ['contact_name', 'Café Caruso'],
            ['contact_street', 'Hauptstraße 36'],
            ['contact_city', '73312 Geislingen an der Steige'],
            ['contact_phone', '07331 9467928'],
            ['contact_email', 'info@cafe-caruso.de'],
            ['contact_instagram', 'cafecaruso_']
        ];
        $stmt = $pdo->prepare("INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)");
        foreach ($settings as $s) {
            $stmt->execute($s);
        }
    }

    $count = $pdo->query("SELECT COUNT(*) FROM gallery_images")->fetchColumn();
    if ($count == 0) {
        $images = [
            ['/images/gallery/gallery-06.webp', 'Caruso Bar mit Premium-Spirituosen', 'col-span-2', 0],
            ['/images/gallery/gallery-04.webp', 'Premium Shisha mit Cocktail', '', 1],
            ['/images/gallery/gallery-01.webp', 'Gemütliche Lounge-Ecke', '', 2],
            ['/images/gallery/gallery-03.webp', 'Speisen, Cocktails und Pizza', 'col-span-2', 3],
            ['/images/gallery/gallery-05.webp', 'Handgefertigter Cocktail', '', 4],
            ['/images/gallery/gallery-02.webp', 'Chesterfield Lounge-Bereich', '', 5],
            ['/images/gallery/gallery-07.webp', 'Tropischer Cocktail mit Pizza', '', 6]
        ];
        $stmt = $pdo->prepare("INSERT INTO gallery_images (src, alt, span, order_index) VALUES (?, ?, ?, ?)");
        foreach ($images as $img) {
            $stmt->execute($img);
        }
    }

    echo "Database setup successful. Tables created and seeded.";
}
catch (Exception $e) {
    echo "Setup error: " . $e->getMessage();
}
?>