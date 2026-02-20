<?php
// save-menu.php
header('Content-Type: application/json');
require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !is_array($input)) {
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Get all current category IDs from DB
    $stmt = $pdo->query("SELECT id FROM categories");
    $existingCatIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $incomingCatIds = [];

    foreach ($input as $index => $cat) {
        // Update or Insert Category
        if (isset($cat['id']) && !str_starts_with($cat['id'], 'cat-')) {
            $stmt = $pdo->prepare("UPDATE categories SET name = ?, is_special = ?, bg_color = ?, order_index = ? WHERE id = ?");
            $stmt->execute([$cat['name'], $cat['is_special'] ? 1 : 0, $cat['bg_color'], $index, $cat['id']]);
            $catId = $cat['id'];
        }
        else {
            $stmt = $pdo->prepare("INSERT INTO categories (name, is_special, bg_color, order_index) VALUES (?, ?, ?, ?)");
            $stmt->execute([$cat['name'], $cat['is_special'] ? 1 : 0, $cat['bg_color'], $index]);
            $catId = $pdo->lastInsertId();
        }
        $incomingCatIds[] = (int)$catId;

        // Sync items for this category
        $stmt = $pdo->prepare("SELECT id FROM items WHERE category_id = ?");
        $stmt->execute([$catId]);
        $existingItemIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $incomingItemIds = [];

        if (isset($cat['items']) && is_array($cat['items'])) {
            foreach ($cat['items'] as $itemIndex => $item) {
                if (isset($item['id']) && !str_starts_with($item['id'], 'item-')) {
                    $stmtItem = $pdo->prepare("UPDATE items SET name = ?, price = ?, unit = ?, info = ?, order_index = ?, category_id = ? WHERE id = ?");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'], $item['info'], $itemIndex, $catId, $item['id']]);
                    $itemId = $item['id'];
                }
                else {
                    $stmtItem = $pdo->prepare("INSERT INTO items (name, price, unit, info, order_index, category_id) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'], $item['info'], $itemIndex, $catId]);
                    $itemId = $pdo->lastInsertId();
                }
                $incomingItemIds[] = (int)$itemId;
            }
        }

        // Delete items from this category that are NOT in the incoming list
        $itemsToDelete = array_diff($existingItemIds, $incomingItemIds);
        if (!empty($itemsToDelete)) {
            $placeholders = implode(',', array_fill(0, count($itemsToDelete), '?'));
            $stmtDel = $pdo->prepare("DELETE FROM items WHERE id IN ($placeholders)");
            $stmtDel->execute(array_values($itemsToDelete));
        }
    }

    // 2. Delete categories that are NOT in the incoming list
    $catsToDelete = array_diff($existingCatIds, $incomingCatIds);
    if (!empty($catsToDelete)) {
        $placeholders = implode(',', array_fill(0, count($catsToDelete), '?'));

        // Delete items belonging to these categories first (if no CASCADE)
        $stmtDelItems = $pdo->prepare("DELETE FROM items WHERE category_id IN ($placeholders)");
        $stmtDelItems->execute(array_values($catsToDelete));

        $stmtDel = $pdo->prepare("DELETE FROM categories WHERE id IN ($placeholders)");
        $stmtDel->execute(array_values($catsToDelete));
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