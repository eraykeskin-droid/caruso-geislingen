<?php
// get-menu.php
header('Content-Type: application/json');
require_once 'db.php';

try {
    // Fetch categories
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY order_index ASC");
    $categories = $stmt->fetchAll();

    // Fetch items for each category
    foreach ($categories as &$category) {
        $stmtItems = $pdo->prepare("SELECT * FROM items WHERE category_id = ? ORDER BY order_index ASC");
        $stmtItems->execute([$category['id']]);
        $category['items'] = $stmtItems->fetchAll();
    }

    echo json_encode($categories);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>