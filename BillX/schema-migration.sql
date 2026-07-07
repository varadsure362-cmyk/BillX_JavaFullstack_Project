-- =====================================================================
-- POS System — Initial Schema Migration (MySQL / Aiven)
-- Two roles only: CASHIER, MANAGER. No shifts. No super-admin/store tables.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;

-- ---------------------------------------------------------------------
-- BRANCHES
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500),
    working_days VARCHAR(100), -- e.g. "Mon,Tue,Wed,Thu,Fri,Sat"
    razorpay_key_id VARCHAR(255) NULL,
    razorpay_key_secret VARCHAR(500) NULL,
    razorpay_webhook_secret VARCHAR(500) NULL,
    razorpay_connected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- USERS (Cashiers + Managers)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255), -- nullable when auth_provider = GOOGLE and no local password set
    phone VARCHAR(20),
    role ENUM('CASHIER', 'MANAGER') NOT NULL,
    auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    branch_id BIGINT NULL, -- used only for CASHIER role (single branch)
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch ON users(branch_id);

-- ---------------------------------------------------------------------
-- MANAGER_BRANCHES (many-to-many: a manager can oversee multiple branches)
-- ---------------------------------------------------------------------
CREATE TABLE manager_branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    manager_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mb_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mb_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE KEY uq_manager_branch (manager_id, branch_id)
);

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    branch_id BIGINT NULL, -- NULL = global category shared across branches
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id BIGINT NULL,
    branch_id BIGINT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(500), -- Cloudinary URL
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX idx_products_branch ON products(branch_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    branch_id BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL,
    cashier_id BIGINT NOT NULL,
    customer_id BIGINT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('PERCENT', 'FLAT') NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    order_note VARCHAR(500),
    status ENUM('PENDING', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ---------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ---------------------------------------------------------------------
-- PAYMENTS (Razorpay: Card, Cash, UPI)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    method ENUM('CARD', 'CASH', 'UPI') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_status ON payments(status);

-- ---------------------------------------------------------------------
-- REFUNDS
-- ---------------------------------------------------------------------
CREATE TABLE refunds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    processed_by BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_user FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_refunds_order ON refunds(order_id);

-- ---------------------------------------------------------------------
-- INVENTORY LOGS
-- ---------------------------------------------------------------------
CREATE TABLE inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    change_type ENUM('RESTOCK', 'SALE', 'ADJUSTMENT') NOT NULL,
    quantity_changed INT NOT NULL,
    resulting_quantity INT NOT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_logs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_logs_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);

-- ---------------------------------------------------------------------
-- ALERTS (low stock, no-sales, refund spikes)
-- ---------------------------------------------------------------------
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    type ENUM('LOW_STOCK', 'NO_SALES', 'REFUND_SPIKE') NOT NULL,
    message VARCHAR(500) NOT NULL,
    reference_id BIGINT NULL, -- product id or order id, depending on type
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_branch ON alerts(branch_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- ---------------------------------------------------------------------
-- WEEKLY REPORTS (metadata for generated PDF reports)
-- ---------------------------------------------------------------------
CREATE TABLE weekly_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    file_path VARCHAR(500),
    emailed_to VARCHAR(255),
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_weekly_reports_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX idx_weekly_reports_branch ON weekly_reports(branch_id);

-- =====================================================================
-- SEED DATA (optional — minimal data to test the app end-to-end)
-- =====================================================================

INSERT INTO branches (name, address, working_days) VALUES
('Surat East Branch', 'Ambavadi Choke, Near Ashoka Complex, Surat', 'Mon,Tue,Wed,Thu,Fri,Sat');

-- Password below is a placeholder BCrypt hash — replace with a real hash generated by your app.
INSERT INTO users (full_name, email, password, phone, role, auth_provider, branch_id) VALUES
('Demo Manager', 'manager@example.com', '$2a$10$replaceWithRealBcryptHash', '9999999999', 'MANAGER', 'LOCAL', NULL),
('Demo Cashier', 'cashier@example.com', '$2a$10$replaceWithRealBcryptHash', '9999999998', 'CASHIER', 'LOCAL', 1);

INSERT INTO manager_branches (manager_id, branch_id) VALUES (1, 1);

INSERT INTO categories (name, branch_id) VALUES
('T-Shirts', NULL),
('Women Dress', NULL),
('Footwear', NULL),
('Home Furniture', NULL);

INSERT INTO products (name, sku, category_id, branch_id, price, stock_quantity, low_stock_threshold) VALUES
('Slim Fit Checked Shirt', 'TSHIRT-COTTON-2025', 1, 1, 599.00, 20, 5),
('Self Design Georgette Dress', 'ANARKALI-GREEN-S', 2, 1, 599.00, 15, 5),
('Wedding Shoes', 'SHOES-WEDDING-2025', 3, 1, 999.00, 10, 3),
('Samjeeda Handloom Item', 'RUNNER-RED-2025', 4, 1, 399.00, 8, 3);
