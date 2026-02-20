-- Database Initialization Script for Café Caruso

CREATE DATABASE IF NOT EXISTS caruso_db;
USE caruso_db;

-- 1. Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_special BOOLEAN DEFAULT FALSE,
    bg_color VARCHAR(7) DEFAULT '#000000',
    order_index INT DEFAULT 0
);

-- 2. Items Table
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    info TEXT,
    order_index INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. Reservations Table
CREATE TABLE reservations (
    id_pk INT AUTO_INCREMENT PRIMARY KEY,
    id VARCHAR(10) UNIQUE NOT NULL, -- External ID like C4012
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    guests INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    comment TEXT,
    status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Mock Data (Optional)
INSERT INTO categories (name, is_special, bg_color, order_index) VALUES 
('Cocktails', TRUE, '#ffe08a', 0),
('Softdrinks', FALSE, '#000000', 1);

INSERT INTO items (category_id, name, price, unit, info, order_index) VALUES 
(1, 'Sex on the Beach', 9.50, '0,4l', 'Wodka, Pfirsichlikör, Orangen-, Ananas- & Cranberrysaft', 0),
(2, 'Coca Cola', 4.20, '0,33l', 'Eiskalt serviert', 0);
