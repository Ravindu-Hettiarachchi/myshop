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
