<?php
require_once 'db.php';

header('Content-Type: application/json');

// --- Sync Gallery Logic ---
// Optional: Only sync if requested via ?sync=1 to keep main site fast, 
// but for this small site, always syncing keeps it simple and consistent.
try {
    // Relative path from public/api/ to public/images/gallery/
    $gallery_dir = dirname(__DIR__) . '/images/gallery/';
    if (is_dir($gallery_dir)) {
        $files = glob($gallery_dir . "*.{jpg,jpeg,png,webp}", GLOB_BRACE);

        // Get existing sources
        $existing_stmt = $pdo->query("SELECT src FROM gallery_images");
        $existing_sources = $existing_stmt->fetchAll(PDO::FETCH_COLUMN);

        // Find highest order_index
        $order_stmt = $pdo->query("SELECT MAX(order_index) FROM gallery_images");
        $max_order = $order_stmt->fetchColumn();
        $next_order = ($max_order === null) ? 0 : $max_order + 1;

        foreach ($files as $file) {
            $filename = basename($file);
            $src = '/images/gallery/' . $filename;

            if (!in_array($src, $existing_sources)) {
                // New file found! Insert with defaults
                $insert_stmt = $pdo->prepare("INSERT INTO gallery_images (src, alt, description, span, order_index) VALUES (?, ?, ?, ?, ?)");
                $insert_stmt->execute([$src, 'Galerie Bild', '', '', $next_order]);
                $next_order++;
            }
        }
    }
}
catch (Exception $e) {
    // Log error but continue to return existing data
    error_log("Gallery sync error: " . $e->getMessage());
}
// --- End Sync Gallery ---

try {
    // Get Opening Hours
    $hours_stmt = $pdo->query("SELECT id, day_name as name, hours FROM opening_hours ORDER BY order_index ASC");
    $days = $hours_stmt->fetchAll();

    // Get Contact Info
    $settings_stmt = $pdo->query("SELECT setting_key, setting_value FROM website_settings");
    $settings_raw = $settings_stmt->fetchAll();
    $contact = [];

    // Map settings to object
    $mapping = [
        'contact_name' => 'name',
        'contact_street' => 'street',
        'contact_city' => 'city',
        'contact_phone' => 'phone',
        'contact_email' => 'email',
        'contact_instagram' => 'instagram'
    ];

    // Initialize with empty strings
    foreach ($mapping as $db_key => $obj_key) {
        $contact[$obj_key] = '';
    }

    foreach ($settings_raw as $row) {
        if (isset($mapping[$row['setting_key']])) {
            $contact[$mapping[$row['setting_key']]] = $row['setting_value'];
        }
    }

    // Get Gallery Images
    $gallery_stmt = $pdo->query("SELECT id, src, alt, description, span FROM gallery_images ORDER BY order_index ASC");
    $images = $gallery_stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'days' => $days,
        'contact' => $contact,
        'images' => $images
    ]);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>