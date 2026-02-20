-- Menu Migration Script for Café Caruso
-- This script populates the 'categories' and 'items' tables with data from caruso-geislingen.de

USE caruso_db;

-- Clear existing data to avoid duplicates during migration
DELETE FROM items;
DELETE FROM categories;

-- Reset Auto-Increment
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE items AUTO_INCREMENT = 1;

-- 1. BERÜCHTIGTE WINTERKARTE
INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Winterkarte: Tee', TRUE, '#ffe08a', 0);
SET @cat_tee = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_tee, 'Bratapfel', 3.60, '', 'Winterlicher Genuss', 0),
(@cat_tee, 'Zimtstern Orange', 3.60, '', '', 1),
(@cat_tee, 'Kirsche Marzipan', 3.60, '', '', 2),
(@cat_tee, 'Winterpunsch Mandel', 3.60, '', '', 3),
(@cat_tee, 'Zimtschnecke', 3.60, '', '', 4),
(@cat_tee, 'Vanille Pfirsich', 3.60, '', '', 5);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Winterkarte: Heiße Schokolade', TRUE, '#ffe08a', 1);
SET @cat_choco = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_choco, 'Spekulatius Schokolade', 4.50, '', '', 0),
(@cat_choco, 'Pekannuss Schokolade', 4.50, '', '', 1),
(@cat_choco, 'Weiße Schokolade', 4.50, '', '', 2),
(@cat_choco, 'Dunkle Schokolade', 4.50, '', '', 3),
(@cat_choco, 'Klassische Schokolade', 4.50, '', '', 4);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Winter Specials', TRUE, '#ffe08a', 2);
SET @cat_winter_spec = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_winter_spec, 'Winter Mojito', 6.90, '0,4l', '', 0),
(@cat_winter_spec, 'Orange Cinnamon Fizz', 5.90, '0,4l', '', 1),
(@cat_winter_spec, 'Spekulatius Latte', 4.50, '', '', 2),
(@cat_winter_spec, 'Cherry Cola Winter', 5.90, '0,4l', '', 3);

-- 2. GETRÄNKEKARTE
INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Milchhaltige Getränke', FALSE, '#000000', 3);
SET @cat_milch = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_milch, 'ESN Protein Shake', 4.50, '0,45l', 'Verschiedene Sorten', 0),
(@cat_milch, 'Eiskaffee', 4.50, '0,45l', 'Mit Vanilleeis', 1),
(@cat_milch, 'Iced Chai Latte', 4.50, '0,45l', '', 2);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Wasser', FALSE, '#000000', 4);
SET @cat_wasser = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_wasser, 'San Pellegrino', 3.20, '0,25l', 'Spritzig', 0),
(@cat_wasser, 'Aqua Panna', 3.20, '0,25l', 'Still', 1),
(@cat_wasser, 'San Pellegrino', 5.90, '0,75l', 'Spritzig', 2),
(@cat_wasser, 'Aqua Panna', 5.90, '0,75l', 'Still', 3);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Softdrinks', FALSE, '#000000', 5);
SET @cat_soft = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_soft, 'Coca Cola', 4.20, '0,33l', '', 0),
(@cat_soft, 'Coca Cola Zero', 4.20, '0,33l', '', 1),
(@cat_soft, 'Fanta / Exotic', 4.20, '0,33l', '', 2),
(@cat_soft, 'Sprite', 4.20, '0,33l', '', 3),
(@cat_soft, 'Paulaner Spezi', 4.20, '0,33l', '', 4);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Elephant Bay Eistee', FALSE, '#000000', 6);
SET @cat_eistee = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_eistee, 'Peach', 4.20, '0,33l', '', 0),
(@cat_eistee, 'Lemon', 4.20, '0,33l', '', 1),
(@cat_eistee, 'Blueberry', 4.20, '0,33l', '', 2),
(@cat_eistee, 'Mango Pineapple', 4.20, '0,33l', '', 3),
(@cat_eistee, 'Watermelon', 4.20, '0,33l', '', 4),
(@cat_eistee, 'Cherry', 4.20, '0,33l', '', 5),
(@cat_eistee, 'Pomegranate', 4.20, '0,33l', '', 6),
(@cat_eistee, 'Peach Zero', 4.20, '0,33l', '', 7);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Säfte & Nektar', FALSE, '#000000', 7);
SET @cat_saft = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_saft, 'Kirsche', 3.90, '0,4l', '', 0),
(@cat_saft, 'Banane', 3.90, '0,4l', '', 1),
(@cat_saft, 'Maracuja', 3.90, '0,4l', '', 2),
(@cat_saft, 'Orange', 3.90, '0,4l', '', 3),
(@cat_saft, 'Ananas', 3.90, '0,4l', '', 4),
(@cat_saft, 'Cranberry', 3.90, '0,4l', '', 5),
(@cat_saft, 'Johannisbeere', 3.90, '0,4l', '', 6);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Biere', FALSE, '#000000', 8);
SET @cat_bier = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_bier, 'Halbe', 3.90, '0,5l', '', 0),
(@cat_bier, 'Hefeweizen', 3.90, '0,5l', '', 1),
(@cat_bier, 'Kristallweizen', 3.90, '0,5l', '', 2),
(@cat_bier, 'Radler', 3.60, '0,33l', '', 3),
(@cat_bier, 'Desperados', 4.40, '0,33l', '', 4),
(@cat_bier, 'Corona', 4.40, '0,33l', '', 5);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Cocktails', TRUE, '#ffe08a', 9);
SET @cat_cocktail = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_cocktail, 'Caipirinha', 7.90, '0,4l', 'Pitu, Rohrzucker, Limette', 0),
(@cat_cocktail, 'Mojito', 7.90, '0,4l', 'Rum, Minze, Limette', 1),
(@cat_cocktail, 'Sex on the Beach', 7.90, '0,4l', 'Wodka, Pfirsichlikör, Säfte', 2),
(@cat_cocktail, 'Swimming Pool', 7.90, '0,4l', 'Wodka, Rum, Blue Curacao, Kokos, Sahne', 3);

-- 3. SHISHA
INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Shisha: Traditionell', FALSE, '#000000', 10);
SET @cat_shisha_trad = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_shisha_trad, 'Traube Minze', 14.00, '', '', 0),
(@cat_shisha_trad, 'Falim', 14.00, '', '', 1);

INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Shisha: Modern', FALSE, '#000000', 11);
SET @cat_shisha_mod = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_shisha_mod, 'Massai', 14.00, '', '', 0),
(@cat_shisha_mod, 'Love 66', 14.00, '', '', 1),
(@cat_shisha_mod, 'African Queen', 14.00, '', '', 2),
(@cat_shisha_mod, 'Hamburg 187', 14.00, '', '', 3);

-- 4. ANGEBOTE
INSERT INTO categories (name, is_special, bg_color, order_index) VALUES ('Unsere Angebote', TRUE, '#f3ff8a', 12);
SET @cat_offer = LAST_INSERT_ID();
INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(@cat_offer, 'Bier-Angebot', 3.00, '', 'Sa & So bis 18:00 Uhr', 0),
(@cat_offer, 'Kombi: Shisha & Tee', 14.90, '', '', 1),
(@cat_offer, 'Kombi: Shisha & Softdrink', 15.90, '', '', 2);
