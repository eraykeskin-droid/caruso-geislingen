-- Add subcategories support to database

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Add subcategory_id to items table (nullable for direct items in category)
ALTER TABLE items ADD COLUMN subcategory_id INT NULL;
ALTER TABLE items ADD FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX idx_items_subcategory ON items(subcategory_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
