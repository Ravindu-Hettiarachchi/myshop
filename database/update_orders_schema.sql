-- Orders & Invoicing Schema Migration Update

-- 1. Create the order_items table for line-item tracking
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Add dynamic Invoice Configuration fields to shops
ALTER TABLE public.shops 
    ADD COLUMN IF NOT EXISTS company_address TEXT,
    ADD COLUMN IF NOT EXISTS invoice_notes TEXT,
    ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.00;

-- 3. Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for order_items
-- Customers (Anonymous & Authenticated) can insert order items when creating an order
CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Customers can view their own order items if they know the order ID (Assuming no direct customer row-link yet, 
-- but normally linked via a session or token. In this loose model, anyone with the ID can view)
CREATE POLICY "Public can view order items" 
ON public.order_items FOR SELECT 
TO anon, authenticated
USING (true);

-- Shop Owners can view all order items belonging to their shop's orders
CREATE POLICY "Shop owners can manage their order items" 
ON public.order_items FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.shops s ON o.shop_id = s.id
        WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
    )
);

-- 5. Force update the DB cache/realtime
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- 6. Add unit-aware quantity metadata for grocery-style mixed products
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS ordered_quantity DECIMAL(12,3),
    ADD COLUMN IF NOT EXISTS ordered_unit TEXT CHECK (ordered_unit IN ('item', 'kg', 'g', 'litre', 'ml', 'pack')),
    ADD COLUMN IF NOT EXISTS selling_unit_value DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS selling_unit TEXT CHECK (selling_unit IN ('item', 'kg', 'g', 'litre', 'ml', 'pack'));

UPDATE public.order_items
SET
    ordered_quantity = COALESCE(ordered_quantity, quantity::DECIMAL),
    ordered_unit = COALESCE(ordered_unit, 'item'),
    selling_unit_value = COALESCE(selling_unit_value, 1),
    selling_unit = COALESCE(selling_unit, 'item');

-- 7. Tie orders to authenticated customer identity
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.orders
SET customer_auth_id = auth.uid()
WHERE customer_auth_id IS NULL
  AND customer_email = current_setting('request.jwt.claims', true)::json->>'email';

CREATE INDEX IF NOT EXISTS idx_orders_shop_customer_auth
    ON public.orders (shop_id, customer_auth_id);

-- 8. Customer-facing policies based on ownership (customer_auth_id)
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
CREATE POLICY "Customers can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_auth_id = auth.uid());

DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;
CREATE POLICY "Customers can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (customer_auth_id = auth.uid());

DROP POLICY IF EXISTS "Customers can view their order items" ON public.order_items;
CREATE POLICY "Customers can view their order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.customer_auth_id = auth.uid()
    )
);

-- 9. Shop-scoped customer linkage
CREATE TABLE IF NOT EXISTS public.shop_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(shop_id, auth_user_id)
);

ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS shop_customer_id UUID REFERENCES public.shop_customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shop_customers_shop_user
    ON public.shop_customers (shop_id, auth_user_id);

CREATE INDEX IF NOT EXISTS idx_orders_shop_customer_id
    ON public.orders (shop_customer_id);

DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;
CREATE POLICY "Customers can insert orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
    customer_auth_id = auth.uid()
    AND (
        shop_customer_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.shop_customers sc
            WHERE sc.id = orders.shop_customer_id
              AND sc.shop_id = orders.shop_id
              AND sc.auth_user_id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.customer_auth_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

DROP POLICY IF EXISTS "Customers can manage own shop customer profile" ON public.shop_customers;
CREATE POLICY "Customers can manage own shop customer profile"
ON public.shop_customers FOR ALL
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE shop_customers;
