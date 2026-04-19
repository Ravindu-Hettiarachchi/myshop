-- sale_upgrade.sql
-- Run this in your Supabase SQL Editor to add Sale logic to the products and variants tables.

-- 1. Add compare_at_price to main products
ALTER TABLE public.products
ADD COLUMN compare_at_price numeric;

-- 2. Add compare_at_price to product_variants
ALTER TABLE public.product_variants
ADD COLUMN compare_at_price numeric;

-- 3. Invalidate or refresh any schema caches (Optional but good practice)
NOTIFY pgrst, 'reload schema';
