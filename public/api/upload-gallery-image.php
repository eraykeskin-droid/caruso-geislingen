<?php
require_once 'auth-helper.php';
requireLogin(['admin']);
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

if (!isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'error' => 'No image uploaded']);
    exit;
}

try {
    $file = $_FILES['image'];
    $path_info = pathinfo($file['name']);
    $original_name = $path_info['filename'];
    $ext = isset($path_info['extension']) ? $path_info['extension'] : 'webp';

    // Sanitize filename for SEO
    $seo_name = strtolower($original_name);
    $seo_name = preg_replace('/[^a-z0-9]+/', '-', $seo_name);
    $seo_name = trim($seo_name, '-');

    // Fallback if empty
    if (empty($seo_name)) {
        $seo_name = 'gallery-image';
    }

    // New naming convention: caruso-geislingen-[sanitized-name]-[short-hash].[ext]
    $filename = 'caruso-geislingen-' . $seo_name . '-' . substr(uniqid(), -5) . '.' . $ext;

    $upload_dir = $_SERVER['DOCUMENT_ROOT'] . '/images/gallery/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $dest = $upload_dir . $filename;
    if (move_uploaded_file($file['tmp_name'], $dest)) {
        $src = '/images/gallery/' . $filename;
        $alt = isset($_POST['alt']) ? $_POST['alt'] : '';

        // Get max order index
        $order_stmt = $pdo->query("SELECT MAX(order_index) FROM gallery_images");
        $max_order = $order_stmt->fetchColumn();
        $new_order = ($max_order === null) ? 0 : $max_order + 1;

        $stmt = $pdo->prepare("INSERT INTO gallery_images (src, alt, description, span, order_index) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$src, $alt, '', '', $new_order]);
        $new_id = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'image' => [
                'id' => $new_id,
                'src' => $src,
                'alt' => $alt,
                'description' => '',
                'span' => ''
            ]
        ]);
    }
    else {
        throw new Exception('Failed to move uploaded file');
    }
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>