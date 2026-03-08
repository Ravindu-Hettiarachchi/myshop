-- eShop SaaS Platform Schema (Supabase PostgreSQL)

-- Establish an enum for shop theme selection
CREATE TYPE user_role AS ENUM ('admin', 'shop_owner', 'customer');
CREATE TYPE shop_theme AS ENUM ('modern-dark', 'classic-light');
CREATE TYPE order_status AS ENUM ('processing', 'shipped', 'delivered');

-- 1. Owners Table (Shop Owners)
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Maps to auth.users id
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    role user_role DEFAULT 'shop_owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Shops Table (Module 1: Pre-Live Verification & Module 2: Settings Panel)
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
    shop_name VARCHAR(150) NOT NULL,
    route_path VARCHAR(255) UNIQUE NOT NULL, -- The hardcoded route path piece like 'ceylon-spices'
    is_approved BOOLEAN DEFAULT FALSE, -- Admin Approval Console controls this
    -- Storefront Customization Fields
    template VARCHAR(50) DEFAULT 'minimal-white', -- e.g. 'minimal-white', 'modern-dark', 'vibrant-market', 'elegant-boutique'
    primary_color VARCHAR(7) DEFAULT '#3B82F6',  -- HEX color code
    font VARCHAR(50) DEFAULT 'Inter',             -- Font family name
    tagline TEXT,                                  -- Short shop tagline
    banner_url TEXT,                               -- Hero banner image URL
    logo_url TEXT,                                 -- Shop logo image URL
    announcement_bar TEXT,                         -- Top announcement bar text
    footer_text TEXT,                              -- Footer message
    -- Invoice Generation Customization Fields
    company_address TEXT,                          -- Address shown on PDF invoices
    invoice_notes TEXT,                            -- Custom notes/terms shown on invoices
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,           -- Tax rate percentage applied to orders
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products Table (Module 3: Product Dashboard & Low-Stock Alert System)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5, -- Triggers realtime Supabase alerts
    image_urls TEXT[], -- Multi-image gallery URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table (Module 4: Status Tracker UI & Invoice Generation)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    customer_email VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'processing', -- Status Tracker (Processing -> Shipped -> Delivered)
    invoice_url TEXT, -- Link to automated PDF invoice file
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Order Items Table (Line items for each order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Prevent order corruption if product deleted
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL, -- Captured at time of sale (in case product price changes later)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
---------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 1. Owners Table Policies
CREATE POLICY "Admins can manage all owners" ON owners
    FOR ALL USING (EXISTS (SELECT 1 FROM owners o WHERE o.id = auth.uid() AND o.role = 'admin'));

CREATE POLICY "Users can view own record" ON owners
    FOR SELECT USING (id = auth.uid());

-- 2. Shops Table Policies
CREATE POLICY "Customer can view approved shops" ON shops
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Shop owners can view their own shops" ON shops
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all shops" ON shops
    FOR SELECT USING (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Shop owners can manage their own shops" ON shops
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all shops" ON shops
    FOR ALL USING (EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin'));

-- 3. Products Table Policies
CREATE POLICY "Public products viewable" ON products
    FOR SELECT USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.is_approved = true));

CREATE POLICY "Shop owners can view their own unapproved products" ON products
    FOR SELECT USING (EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Shop owners can manage their products" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Orders Table Policies
CREATE POLICY "Shop owners can view shop orders" ON orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Customers can insert orders" ON orders
    FOR INSERT WITH CHECK (true);

-- 5. Order Items Table Policies
CREATE POLICY "Shop owners can view shop order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN shops ON shops.id = orders.shop_id 
            WHERE orders.id = order_items.order_id AND (shops.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Customers can insert order items" ON order_items
    FOR INSERT WITH CHECK (true);

---------------------------------------------------------------------------------
-- Example Seed Data reflecting Sri Lankan market aesthetics
---------------------------------------------------------------------------------

INSERT INTO owners (id, email, full_name, role) VALUES 
('00000000-0000-0000-0000-000000000000', 'admin@myshop.com', 'System Admin', 'admin'),
('11111111-1111-1111-1111-111111111111', 'nuwan@example.com', 'Nuwan Karunaratne', 'shop_owner'),
('22222222-2222-2222-2222-222222222222', 'amanda@example.com', 'Amanda Silva', 'shop_owner');

INSERT INTO shops (id, owner_id, shop_name, route_path, is_approved, template, primary_color, font, tagline) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ceylon Spice House', 'ceylon-spices', true, 'minimal-white', '#D97706', 'Inter', 'Authentic flavors from the island of spices'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Lanka Batiks', 'lanka-batiks', true, 'elegant-boutique', '#7C3AED', 'Playfair Display', 'Handcrafted Sri Lankan textiles');

INSERT INTO products (shop_id, title, description, price, stock_quantity, low_stock_threshold, image_urls) VALUES
('33333333-3333-3333-3333-333333333333', 'Premium Cinnamon Sticks', 'Pure Ceylon Cinnamon from Galle.', 1500.00, 50, 10, ARRAY['cinnamon1.jpg', 'cinnamon2.jpg']),
('33333333-3333-3333-3333-333333333333', 'Roasted Curry Powder', 'Traditional recipe for spicy curries.', 800.00, 3, 5, ARRAY['curry.jpg']), -- This has stock 3 with threshold 5, triggering low stock alert
('44444444-4444-4444-4444-444444444444', 'Handloom Saree', 'Beautifully crafted handloom saree.', 12000.00, 15, 3, ARRAY['saree1.jpg', 'saree2.jpg']);

---------------------------------------------------------------------------------
-- MIGRATION SCRIPT: Run this in Supabase SQL Editor if shops table already exists
-- (skip if running fresh schema above)
---------------------------------------------------------------------------------
-- ALTER TABLE shops
--   ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'minimal-white',
--   ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#3B82F6',
--   ADD COLUMN IF NOT EXISTS font VARCHAR(50) DEFAULT 'Inter',
--   ADD COLUMN IF NOT EXISTS tagline TEXT,
--   ADD COLUMN IF NOT EXISTS banner_url TEXT,
--   ADD COLUMN IF NOT EXISTS logo_url TEXT,
--   ADD COLUMN IF NOT EXISTS announcement_bar TEXT,
--   ADD COLUMN IF NOT EXISTS footer_text TEXT,
--   ADD COLUMN IF NOT EXISTS company_address TEXT,
--   ADD COLUMN IF NOT EXISTS invoice_notes TEXT,
--   ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0.00;
--
-- ALTER TABLE products
--   ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
--   ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
--
-- CREATE TABLE IF NOT EXISTS order_items (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
--     product_id UUID REFERENCES products(id) ON DELETE SET NULL,
--     quantity INTEGER NOT NULL CHECK (quantity > 0),
--     unit_price DECIMAL(10, 2) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Shop owners can view shop order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders JOIN shops ON shops.id = orders.shop_id WHERE orders.id = order_items.order_id AND (shops.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM owners WHERE id = auth.uid() AND role = 'admin'))));
-- CREATE POLICY "Customers can insert order items" ON order_items FOR INSERT WITH CHECK (true);

---------------------------------------------------------------------------------
-- Storage Buckets Setup (Logos & Banners)
---------------------------------------------------------------------------------
-- Note: Must be executed by a superuser or via Supabase dashboard.
-- insert into storage.buckets (id, name, public) values ('shop-assets', 'shop-assets', true);
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'shop-assets' );
-- create policy "Authenticated users can upload assets" on storage.objects for insert with check ( bucket_id = 'shop-assets' and auth.role() = 'authenticated' );
-- create policy "Users can update own assets" on storage.objects for update using ( bucket_id = 'shop-assets' and auth.uid() = owner );
-- create policy "Users can delete own assets" on storage.objects for delete using ( bucket_id = 'shop-assets' and auth.uid() = owner );
