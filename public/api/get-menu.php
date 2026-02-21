<?php
// get-menu.php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
require_once 'db.php';

try {
    // Fetch categories
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY order_index ASC");
    $categories = $stmt->fetchAll();

    // Fetch subcategories and items for each category
    foreach ($categories as &$category) {
        // Fetch subcategories
        $stmtSub = $pdo->prepare("SELECT * FROM subcategories WHERE category_id = ? ORDER BY order_index ASC");
        $stmtSub->execute([$category['id']]);
        $subcategories = $stmtSub->fetchAll();
        
        // Fetch items for each subcategory
        foreach ($subcategories as &$subcategory) {
            $stmtItems = $pdo->prepare("SELECT * FROM items WHERE subcategory_id = ? ORDER BY order_index ASC");
            $stmtItems->execute([$subcategory['id']]);
            $subcategory['items'] = $stmtItems->fetchAll();
        }
        $category['subcategories'] = $subcategories;
        
        // Fetch direct items (no subcategory)
        $stmtItems = $pdo->prepare("SELECT * FROM items WHERE category_id = ? AND subcategory_id IS NULL ORDER BY order_index ASC");
        $stmtItems->execute([$category['id']]);
        $category['items'] = $stmtItems->fetchAll();
    }

    echo json_encode($categories);
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>