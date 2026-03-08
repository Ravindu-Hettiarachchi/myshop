-- Re-fixing the `orders` RLS:
-- The previous query: customer_email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
-- failed because `auth.users` is highly restricted and you cannot do a sub-select on it as an authenticated user.
-- The correct standard Supabase approach is to read the email straight from the JWT claims.

DROP POLICY IF EXISTS "Customers can insert orders" ON orders;
CREATE POLICY "Customers can insert orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can insert order items" ON order_items;
CREATE POLICY "Customers can insert order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
CREATE POLICY "Customers can view their own orders" ON orders
    FOR SELECT USING (
        -- Shop Owner checking
        (EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()))
        OR
        -- Auth JWT checking (No Subqueries to auth.users)
        (customer_email = current_setting('request.jwt.claims', true)::json->>'email')
    );

DROP POLICY IF EXISTS "Customers can view their order items" ON order_items;
CREATE POLICY "Customers can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );
