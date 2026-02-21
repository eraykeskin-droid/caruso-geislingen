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

    // Get existing category IDs
    $stmt = $pdo->query("SELECT id FROM categories");
    $existingCatIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $incomingCatIds = [];

    foreach ($input as $index => $cat) {
        // Handle category
        if (isset($cat['id']) && !str_starts_with($cat['id'], 'cat-') && in_array($cat['id'], $existingCatIds)) {
            $stmt = $pdo->prepare("UPDATE categories SET name = ?, is_special = ?, bg_color = ?, badge_text = ?, order_index = ? WHERE id = ?");
            $stmt->execute([$cat['name'], !empty($cat['is_special']) ? 1 : 0, $cat['bg_color'] ?? '#000000', $cat['badge_text'] ?? 'Spezial', $index, $cat['id']]);
            $catId = $cat['id'];
        }
        else {
            $stmt = $pdo->prepare("INSERT INTO categories (name, is_special, bg_color, badge_text, order_index) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$cat['name'], !empty($cat['is_special']) ? 1 : 0, $cat['bg_color'] ?? '#000000', $cat['badge_text'] ?? 'Spezial', $index]);
            $catId = $pdo->lastInsertId();
        }
        $incomingCatIds[] = (int)$catId;

        // Get existing subcategory IDs for this category
        $stmt = $pdo->prepare("SELECT id FROM subcategories WHERE category_id = ?");
        $stmt->execute([$catId]);
        $existingSubIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $incomingSubIds = [];

        // Handle subcategories
        if (isset($cat['subcategories']) && is_array($cat['subcategories'])) {
            foreach ($cat['subcategories'] as $subIndex => $sub) {
                if (isset($sub['id']) && !str_starts_with($sub['id'], 'sub-') && in_array($sub['id'], $existingSubIds)) {
                    $stmt = $pdo->prepare("UPDATE subcategories SET name = ?, order_index = ? WHERE id = ?");
                    $stmt->execute([$sub['name'], $subIndex, $sub['id']]);
                    $subId = $sub['id'];
                }
                else {
                    $stmt = $pdo->prepare("INSERT INTO subcategories (category_id, name, order_index) VALUES (?, ?, ?)");
                    $stmt->execute([$catId, $sub['name'], $subIndex]);
                    $subId = $pdo->lastInsertId();
                }
                $incomingSubIds[] = (int)$subId;

                // Get existing item IDs for this subcategory
                $stmt = $pdo->prepare("SELECT id FROM items WHERE subcategory_id = ?");
                $stmt->execute([$subId]);
                $existingItemIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $incomingItemIds = [];

                // Handle items in subcategory
                if (isset($sub['items']) && is_array($sub['items'])) {
                    foreach ($sub['items'] as $itemIndex => $item) {
                        if (isset($item['id']) && !str_starts_with($item['id'], 'item-') && in_array($item['id'], $existingItemIds)) {
                            $stmtItem = $pdo->prepare("UPDATE items SET name = ?, price = ?, unit = ?, info = ?, allergens = ?, order_index = ?, category_id = ?, subcategory_id = ? WHERE id = ?");
                            $stmtItem->execute([$item['name'], $item['price'], $item['unit'] ?? '', $item['info'] ?? '', $item['allergens'] ?? '', $itemIndex, $catId, $subId, $item['id']]);
                            $itemId = $item['id'];
                        }
                        else {
                            $stmtItem = $pdo->prepare("INSERT INTO items (name, price, unit, info, allergens, order_index, category_id, subcategory_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                            $stmtItem->execute([$item['name'], $item['price'], $item['unit'] ?? '', $item['info'] ?? '', $item['allergens'] ?? '', $itemIndex, $catId, $subId]);
                            $itemId = $pdo->lastInsertId();
                        }
                        $incomingItemIds[] = (int)$itemId;
                    }
                }

                // Delete removed items from subcategory
                $itemsToDelete = array_diff($existingItemIds, $incomingItemIds);
                if (!empty($itemsToDelete)) {
                    $placeholders = implode(',', array_fill(0, count($itemsToDelete), '?'));
                    $stmtDel = $pdo->prepare("DELETE FROM items WHERE id IN ($placeholders)");
                    $stmtDel->execute(array_values($itemsToDelete));
                }
            }
        }

        // Delete removed subcategories
        $subsToDelete = array_diff($existingSubIds, $incomingSubIds);
        if (!empty($subsToDelete)) {
            // First delete items that belong to these subcategories
            $placeholders = implode(',', array_fill(0, count($subsToDelete), '?'));
            $stmtDelItems = $pdo->prepare("DELETE FROM items WHERE subcategory_id IN ($placeholders)");
            $stmtDelItems->execute(array_values($subsToDelete));

            // Then delete the subcategories
            $stmtDel = $pdo->prepare("DELETE FROM subcategories WHERE id IN ($placeholders)");
            $stmtDel->execute(array_values($subsToDelete));
        }

        // Get existing direct item IDs (no subcategory)
        $stmt = $pdo->prepare("SELECT id FROM items WHERE category_id = ? AND subcategory_id IS NULL");
        $stmt->execute([$catId]);
        $existingItemIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $incomingItemIds = [];

        // Handle direct items (no subcategory)
        if (isset($cat['items']) && is_array($cat['items'])) {
            foreach ($cat['items'] as $itemIndex => $item) {
                if (isset($item['id']) && !str_starts_with($item['id'], 'item-') && in_array($item['id'], $existingItemIds)) {
                    $stmtItem = $pdo->prepare("UPDATE items SET name = ?, price = ?, unit = ?, info = ?, allergens = ?, order_index = ?, category_id = ?, subcategory_id = NULL WHERE id = ?");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'] ?? '', $item['info'] ?? '', $item['allergens'] ?? '', $itemIndex, $catId, $item['id']]);
                    $itemId = $item['id'];
                }
                else {
                    $stmtItem = $pdo->prepare("INSERT INTO items (name, price, unit, info, allergens, order_index, category_id, subcategory_id) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)");
                    $stmtItem->execute([$item['name'], $item['price'], $item['unit'] ?? '', $item['info'] ?? '', $item['allergens'] ?? '', $itemIndex, $catId]);
                    $itemId = $pdo->lastInsertId();
                }
                $incomingItemIds[] = (int)$itemId;
            }
        }

        // Delete removed direct items
        $itemsToDelete = array_diff($existingItemIds, $incomingItemIds);
        if (!empty($itemsToDelete)) {
            $placeholders = implode(',', array_fill(0, count($itemsToDelete), '?'));
            $stmtDel = $pdo->prepare("DELETE FROM items WHERE id IN ($placeholders)");
            $stmtDel->execute(array_values($itemsToDelete));
        }
    }

    // Delete removed categories
    $catsToDelete = array_diff($existingCatIds, $incomingCatIds);
    if (!empty($catsToDelete)) {
        $placeholders = implode(',', array_fill(0, count($catsToDelete), '?'));

        // Delete items (both direct and from subcategories)
        $stmtDelItems = $pdo->prepare("DELETE FROM items WHERE category_id IN ($placeholders)");
        $stmtDelItems->execute(array_values($catsToDelete));

        // Delete subcategories first
        $stmtDelSubs = $pdo->prepare("DELETE FROM subcategories WHERE category_id IN ($placeholders)");
        $stmtDelSubs->execute(array_values($catsToDelete));

        // Then delete categories
        $stmtDel = $pdo->prepare("DELETE FROM categories WHERE id IN ($placeholders)");
        $stmtDel->execute(array_values($catsToDelete));
    }

    $pdo->commit();
    echo json_encode(['success' => true]);
}
catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>