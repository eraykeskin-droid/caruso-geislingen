<?php
require_once 'auth-helper.php';
requireLogin(['admin']);
require_once 'db.php';

header('Content-Type: application/json');

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['type'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid data']);
    exit;
}

try {
    switch ($input['type']) {
        case 'opening_hours':
            if (!isset($input['days']))
                throw new Exception('Missing days data');

            $pdo->beginTransaction();
            foreach ($input['days'] as $day) {
                if (isset($day['id'])) {
                    $stmt = $pdo->prepare("UPDATE opening_hours SET hours = ? WHERE id = ?");
                    $stmt->execute([$day['hours'], $day['id']]);
                }
                else {
                    $stmt = $pdo->prepare("UPDATE opening_hours SET hours = ? WHERE day_name = ?");
                    $stmt->execute([$day['hours'], $day['name']]);
                }
            }
            $pdo->commit();
            break;

        case 'contact_info':
            if (!isset($input['contact']))
                throw new Exception('Missing contact data');

            $mapping = [
                'name' => 'contact_name',
                'street' => 'contact_street',
                'city' => 'contact_city',
                'phone' => 'contact_phone',
                'email' => 'contact_email',
                'instagram' => 'contact_instagram'
            ];

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
            foreach ($input['contact'] as $key => $value) {
                if (isset($mapping[$key])) {
                    $stmt->execute([$mapping[$key], $value]);
                }
            }
            $pdo->commit();
            break;

        case 'update_image':
            if (!isset($input['image']))
                throw new Exception('Missing image data');

            // Handle both string IDs (default placeholders) and integer IDs
            $id = $input['image']['id'];
            if (is_numeric($id)) {
                $stmt = $pdo->prepare("UPDATE gallery_images SET alt = ?, description = ?, span = ? WHERE id = ?");
                $stmt->execute([$input['image']['alt'], $input['image']['description'], $input['image']['span'], $id]);
            }
            else {
                // If it's a default ID like "img-1", update by source path instead
                $stmt = $pdo->prepare("UPDATE gallery_images SET alt = ?, description = ?, span = ? WHERE src = ?");
                $stmt->execute([$input['image']['alt'], $input['image']['description'], $input['image']['span'], $input['image']['src']]);
            }
            break;

        case 'delete_image':
            if (!isset($input['id']))
                throw new Exception('Missing image ID');

            $id = $input['id'];
            $stmt = $pdo->prepare("SELECT id, src FROM gallery_images WHERE " . (is_numeric($id) ? "id = ?" : "src = ?"));
            $stmt->execute([$id]);
            $img = $stmt->fetch();

            if ($img) {
                $src = $img['src'];
                if (strpos($src, '/images/gallery/') === 0) {
                    $file_path = $_SERVER['DOCUMENT_ROOT'] . $src;
                    if (file_exists($file_path)) {
                        unlink($file_path);
                    }
                }

                $del_stmt = $pdo->prepare("DELETE FROM gallery_images WHERE id = ?");
                $del_stmt->execute([$img['id']]);
            }
            break;

        case 'reorder_images':
            if (!isset($input['ids']) || !is_array($input['ids']))
                throw new Exception('Missing or invalid image IDs for reordering');

            $pdo->beginTransaction();
            $stmt = $pdo->prepare("UPDATE gallery_images SET order_index = ? WHERE id = ?");
            foreach ($input['ids'] as $index => $id) {
                // Ensure ID is numeric for safety
                if (is_numeric($id)) {
                    $stmt->execute([$index, (int)$id]);
                }
            }
            $pdo->commit();
            break;

        default:
            throw new Exception('Invalid update type: ' . $input['type']);
    }

    echo json_encode(['success' => true]);
}
catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();

    // Log error for debugging
    error_log("Website Save Error (" . $input['type'] . "): " . $e->getMessage());

    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>