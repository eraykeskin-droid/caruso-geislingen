<?php
// migrate-subcategories.php
// Rufe diese Datei einmalig auf, um die Datenbank zu erweitern

header('Content-Type: text/html; charset=utf-8');

echo '<!DOCTYPE html>
<html>
<head>
    <title>Database Migration</title>
    <style>
        body { font-family: monospace; background: #111; color: #0f0; padding: 40px; }
        .success { color: #0f0; }
        .error { color: #f00; }
        .info { color: #ff0; }
    </style>
</head>
<body>
    <h1>Datenbank Migration</h1>
';

require_once __DIR__ . '/api/db.php';

try {
    // Check if subcategories table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'subcategories'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo '<p class="info">Erstelle Tabelle subcategories...</p>';
        $pdo->exec("
            CREATE TABLE subcategories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                order_index INT DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        ");
        echo '<p class="success">✓ Tabelle subcategories erstellt</p>';
    } else {
        echo '<p class="info">Tabelle subcategories existiert bereits</p>';
    }
    
    // Check if subcategory_id column exists in items
    $stmt = $pdo->query("SHOW COLUMNS FROM items LIKE 'subcategory_id'");
    $columnExists = $stmt->rowCount() > 0;
    
    if (!$columnExists) {
        echo '<p class="info">Füge subcategory_id Spalte zu items hinzu...</p>';
        $pdo->exec("ALTER TABLE items ADD COLUMN subcategory_id INT NULL");
        $pdo->exec("ALTER TABLE items ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL");
        $pdo->exec("CREATE INDEX idx_items_subcategory ON items(subcategory_id)");
        $pdo->exec("CREATE INDEX idx_subcategories_category ON subcategories(category_id)");
        echo '<p class="success">✓ Spalte subcategory_id hinzugefügt</p>';
    } else {
        echo '<p class="info">Spalte subcategory_id existiert bereits</p>';
    }
    
    echo '<h2 class="success">Migration erfolgreich abgeschlossen!</h2>';
    echo '<p>Die Datenbank wurde für Unterkategorien erweitert.</p>';
    
} catch (Exception $e) {
    echo '<p class="error">Fehler: ' . htmlspecialchars($e->getMessage()) . '</p>';
}

echo '</body></html>';
?>
