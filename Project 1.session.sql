-- Enable UUID generation for secure, non-sequential IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* =========================================
   1. USERS & AUTHENTICATION
========================================= */
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(50)
);

CREATE TABLE addresses (
    address_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);

/* =========================================
   2. CATALOG (Brands, Categories, Products)
========================================= */
CREATE TABLE brands (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(user_id), -- Multi-vendor support
    brand_id UUID REFERENCES brands(brand_id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    variant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(10, 2),
    dimensions VARCHAR(100),
    attributes JSONB, -- Replaces strict 'Color/Size' for infinite flexibility
    is_active BOOLEAN DEFAULT TRUE
);

/* =========================================
   3. INVENTORY & WAREHOUSES
========================================= */
CREATE TABLE warehouses (
    warehouse_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL
);

CREATE TABLE inventory (
    inventory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    quantity_available INT DEFAULT 0,
    quantity_reserved INT DEFAULT 0,
    UNIQUE (variant_id, warehouse_id)
);

CREATE TABLE inventory_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    quantity_change INT NOT NULL, 
    reason VARCHAR(255) NOT NULL, -- e.g., 'SALE', 'RESTOCK', 'DAMAGE'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================================
   4. CARTS & WISHLISTS
========================================= */
CREATE TABLE carts (
    cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE wishlists (
    wishlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE wishlist_items (
    wishlist_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID REFERENCES wishlists(wishlist_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE
);

/* =========================================
   5. ORDERS & PAYMENTS
========================================= */
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    shipping_address_id UUID REFERENCES addresses(address_id),
    billing_address_id UUID REFERENCES addresses(address_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(variant_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- STRIPE, PAYPAL
    provider_transaction_id VARCHAR(255) UNIQUE, -- ID from the external gateway
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* =========================================
   6. SHIPPING & LOGISTICS
========================================= */
CREATE TABLE shipments (
    shipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PROCESSING',
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE
);

/* =========================================
   7. REVIEWS & PROMOTIONS
========================================= */
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
    coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(50) NOT NULL, -- PERCENTAGE or FIXED
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_value DECIMAL(10, 2) DEFAULT 0.00,
    usage_limit INT, -- NULL for unlimited
    times_used INT DEFAULT 0,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE order_coupons (
    order_coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES coupons(coupon_id)
);

/* =========================================
   8. AUDIT & ANALYTICS
========================================= */
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_affected VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_product_views (
    view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);






/* =========================================
   SEED DATA FOR E-COMMERCE DATABASE
========================================= */

-- 1. Create Brands (Using deterministic UUIDs starting with 'b')
INSERT INTO brands (brand_id, name) VALUES 
('b0000000-0000-0000-0000-000000000001', 'TechPro'),
('b0000000-0000-0000-0000-000000000002', 'HomeEssentials'),
('b0000000-0000-0000-0000-000000000003', 'ActiveWear Co.'),
('b0000000-0000-0000-0000-000000000004', 'Outdoor Gear'),
('b0000000-0000-0000-0000-000000000005', 'Generic Media');

-- 2. Create Categories (Using deterministic UUIDs starting with 'c')
INSERT INTO categories (category_id, name) VALUES 
('c0000000-0000-0000-0000-000000000001', 'Electronics'),
('c0000000-0000-0000-0000-000000000002', 'Home & Kitchen'),
('c0000000-0000-0000-0000-000000000003', 'Apparel'),
('c0000000-0000-0000-0000-000000000004', 'Sports & Outdoors'),
('c0000000-0000-0000-0000-000000000005', 'Books & Media');

-- 3. Create a Warehouse for Inventory
INSERT INTO warehouses (warehouse_id, name, location) VALUES 
('e0000000-0000-0000-0000-000000000001', 'Main Fulfillment Center', 'New York, NY');

-- 4. Insert 50 Products (Using deterministic UUIDs starting with 'f1')
INSERT INTO products (product_id, category_id, brand_id, name, description, base_price) VALUES 
-- Electronics
('f1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Smartphone X', 'Latest edge-to-edge display smartphone.', 899.99),
('f1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Pro Laptop 15"', 'High-performance laptop for professionals.', 1499.99),
('f1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Noise Cancelling Headphones', 'Over-ear wireless headphones.', 249.99),
('f1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Smartwatch Series 5', 'Fitness tracking and heart monitor.', 199.99),
('f1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Tablet 10.4"', 'Perfect for reading and media consumption.', 349.99),
('f1000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '4K Gaming Monitor', '144Hz refresh rate monitor.', 499.99),
('f1000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mechanical Keyboard', 'RGB backlighting, tactile switches.', 89.99),
('f1000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Wireless Gaming Mouse', 'Ultra-low latency mouse.', 59.99),
('f1000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Digital Mirrorless Camera', '24MP sensor, 4K video recording.', 1200.00),
('f1000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Bluetooth Speaker', 'Waterproof portable speaker.', 45.00),

-- Home & Kitchen
('f1000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Espresso Maker', '15-bar pump espresso machine.', 129.99),
('f1000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'High-Speed Blender', '1000W motor for smoothies and ice.', 89.99),
('f1000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Stainless Steel Toaster', '4-slice toaster with bagel setting.', 39.99),
('f1000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Robot Vacuum Cleaner', 'Smart navigation and self-charging.', 299.99),
('f1000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'HEPA Air Purifier', 'Removes 99.97% of allergens.', 149.99),
('f1000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'LED Desk Lamp', 'Adjustable brightness and color temp.', 24.99),
('f1000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Ergonomic Office Chair', 'Lumbar support and breathable mesh.', 199.99),
('f1000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Cotton Bed Sheets', 'Queen size, 400 thread count.', 45.00),
('f1000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Bath Towel Set', '6-piece luxury cotton towels.', 35.00),
('f1000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Cast Iron Skillet', '12-inch pre-seasoned pan.', 29.99),

-- Apparel
('f1000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Basic Cotton T-Shirt', 'Comfortable everyday wear.', 14.99),
('f1000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Slim Fit Jeans', 'Classic blue denim.', 49.99),
('f1000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Fleece Hoodie', 'Warm pullover for cold weather.', 39.99),
('f1000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Running Sneakers', 'Lightweight athletic shoes.', 89.99),
('f1000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Ankle Socks (6-Pack)', 'Moisture-wicking active socks.', 12.99),
('f1000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Winter Puffer Jacket', 'Water-resistant outer layer.', 119.99),
('f1000000-0000-0000-0000-000000000027', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Knit Beanie', 'One size fits all winter hat.', 15.00),
('f1000000-0000-0000-0000-000000000028', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Polarized Sunglasses', 'UV400 protection.', 25.00),
('f1000000-0000-0000-0000-000000000029', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Leather Belt', 'Genuine leather dress belt.', 35.00),
('f1000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Chronograph Watch', 'Stainless steel analog watch.', 150.00),

-- Sports & Outdoors
('f1000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Non-Slip Yoga Mat', '6mm extra thick mat.', 22.99),
('f1000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Adjustable Dumbbells', 'Set of 2, up to 50lbs each.', 199.99),
('f1000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Resistance Band Set', '5 bands with different tension levels.', 19.99),
('f1000000-0000-0000-0000-000000000034', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Insulated Water Bottle', 'Keeps drinks cold for 24 hours.', 29.99),
('f1000000-0000-0000-0000-000000000035', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '4-Person Camping Tent', 'Waterproof setup, easy assembly.', 129.99),
('f1000000-0000-0000-0000-000000000036', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Mummy Sleeping Bag', 'Rated for 20°F weather.', 59.99),
('f1000000-0000-0000-0000-000000000037', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Hiking Backpack 50L', 'Internal frame and rain cover.', 89.99),
('f1000000-0000-0000-0000-000000000038', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Tactical Flashlight', '1000 lumens, rechargeable.', 25.00),
('f1000000-0000-0000-0000-000000000039', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Cycling Helmet', 'Aerodynamic with safety vents.', 45.00),
('f1000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Tennis Racket', 'Lightweight carbon fiber frame.', 79.99),

-- Books & Media
('f1000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Sci-Fi Novel: The Expanse', 'Paperback edition.', 14.99),
('f1000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Healthy Cooking Cookbook', 'Hardcover, 100+ recipes.', 24.99),
('f1000000-0000-0000-0000-000000000043', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Historical Biography', 'Bestselling historical account.', 18.00),
('f1000000-0000-0000-0000-000000000044', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Strategy Board Game', '2-4 players, 60 min playtime.', 45.00),
('f1000000-0000-0000-0000-000000000045', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '1000 Piece Jigsaw Puzzle', 'Beautiful landscape image.', 19.99),
('f1000000-0000-0000-0000-000000000046', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Leather Journal', 'Lined pages, ribbon bookmark.', 22.00),
('f1000000-0000-0000-0000-000000000047', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Fountain Pen', 'Smooth writing, includes ink.', 35.00),
('f1000000-0000-0000-0000-000000000048', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Artist Sketchbook', 'Heavyweight paper for mixed media.', 15.00),
('f1000000-0000-0000-0000-000000000049', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Desk Organizer', 'Wooden storage for pens and notes.', 25.00),
('f1000000-0000-0000-0000-000000000050', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Wall Calendar 2024', '12-month scenic calendar.', 14.99);

-- 5. Create 1 Variant per Product (Dynamically matching the product IDs)
-- Notice the JSONB attributes being used here to showcase the power of your schema!
INSERT INTO product_variants (variant_id, product_id, sku, price, attributes)
SELECT 
    -- Generate a unique variant ID by replacing the 'f1' prefix of the product with 'f2'
    overlay(product_id::text placing 'f2' from 1 for 2)::uuid,
    product_id,
    'SKU-' || substring(product_id::text from 35 for 2), -- Simple SKU generation
    base_price,
    CASE 
        WHEN category_id = 'c0000000-0000-0000-0000-000000000001' THEN '{"color": "Black", "warranty": "1 Year"}'::jsonb
        WHEN category_id = 'c0000000-0000-0000-0000-000000000003' THEN '{"size": "L", "color": "Navy", "material": "Cotton"}'::jsonb
        ELSE '{"condition": "New"}'::jsonb
    END
FROM products;

-- 6. Add Inventory for all 50 Variants
INSERT INTO inventory (variant_id, warehouse_id, quantity_available, quantity_reserved)
SELECT 
    variant_id,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    floor(random() * 100 + 10)::int, -- Random stock between 10 and 110
    0
FROM product_variants;