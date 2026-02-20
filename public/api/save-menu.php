<?php
// save-menu.php
header('Content-Type: application/json');
require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
// Expects an array of categories with items

if (!$input || !is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

try {
    $pdo->beginTransaction();

    foreach ($input as $index => $cat) {
        // Update or Insert Category
        if (isset($cat['id']) && !str_starts_with($cat['id'], 'cat-')) {
            $stmt = $pdo->prepare("UPDATE categories SET name = ?, is_special = ?, bg_color = ?, order_index = ? WHERE id = ?");
            $stmt->execute([$cat['name'], $cat['is_special'], $cat['bg_color'], $index, $cat['id']]);
            $catId = $cat['id'];
        }
        else {
            $stmt = $pdo->prepare("INSERT INTO categories (name, is_special, bg_color, order_index) VALUES (?, ?, ?, ?)");
            $stmt->execute([$cat['name'], $cat['is_special'], $cat['bg_color'], $index]);
            $catId = $pdo->lastInsertId();
        }

        // Handle items for this category
        if (isset($cat['items']) && is_array($cat['items'])) {
            foreach ($cat['items'] as $itemIndex => $item) {
                if (isset($item['id']) && !str_starts_with($item['id'], 'item-')) {
                    $stmtItem = $pdo->prepare("UPDATE items SET name = ?, price = ?, unit = ?, info = ?, order_index = ?, category_id = ? WHERE id = ?");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'], $item['info'], $itemIndex, $catId, $item['id']]);
                }
                else {
                    $stmtItem = $pdo->prepare("INSERT INTO items (name, price, unit, info, order_index, category_id) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'], $item['info'], $itemIndex, $catId]);
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);
}
catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>