-- Enable RLS on product_variants so Row-Level Security doesn't block shop owners
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing if they were created accidentally
DROP POLICY IF EXISTS "Public read access to product variants" ON product_variants;
DROP POLICY IF EXISTS "Shop owners manage their variants" ON product_variants;

-- Allow anyone to read product variants (necessary for storefronts to show variants)
CREATE POLICY "Public read access to product variants" 
ON product_variants FOR SELECT 
USING (true);

-- Allow shop owners to insert, update, and delete their own variants
CREATE POLICY "Shop owners manage their variants" 
ON product_variants FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM products 
        JOIN shops ON shops.id = products.shop_id 
        WHERE products.id = product_variants.product_id 
        AND shops.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM products 
        JOIN shops ON shops.id = products.shop_id 
        WHERE products.id = product_variants.product_id 
        AND shops.owner_id = auth.uid()
    )
);
