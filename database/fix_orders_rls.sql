-- Fix for Checkout Error: {}
-- Customers currently have INSERT permissions but lack SELECT permissions.
-- When Supabase runs `.insert(...).select().single()`, it fails to read the created row back, throwing an error.

CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT 
USING (
    customer_email = auth.jwt()->>'email'
);

-- Note: Ensure RLS is enabled on the table (it already is based on schema.sql)
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
