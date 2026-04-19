-- ============================================================
-- Inventory Management — Stock Decrement Trigger Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Function: Decrement stock when order items are inserted
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Reduce stock_quantity for the product by the ordered quantity
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Fire the function after each order_items insert
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION decrement_stock_on_order();

-- 3. Function: Get low-stock products for a shop (used by dashboard alerts)
CREATE OR REPLACE FUNCTION get_stock_alerts(p_shop_id UUID)
RETURNS TABLE (
    id          UUID,
    title       TEXT,
    stock_quantity INT,
    low_stock_threshold INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title::TEXT,
        p.stock_quantity,
        p.low_stock_threshold
    FROM public.products p
    WHERE p.shop_id = p_shop_id
      AND p.stock_quantity <= p.low_stock_threshold
    ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Allow shop owners to update stock_quantity on their own products
-- (This policy should already exist from base schema, but adding if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'products'
          AND policyname = 'Shop owners can manage their products'
    ) THEN
        CREATE POLICY "Shop owners can manage their products" ON public.products
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.owners WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
END $$;

-- ============================================================
-- Done. Verify trigger with:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'trg_decrement_stock';
-- ============================================================
