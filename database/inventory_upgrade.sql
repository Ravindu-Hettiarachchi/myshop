-- Add sku and is_active to products if they do not exist
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS sku TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create stock_movements table for audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_delta NUMERIC NOT NULL,
    previous_stock NUMERIC NOT NULL,
    new_stock NUMERIC NOT NULL,
    reason TEXT NOT NULL, -- 'ORDER_PLACED', 'MANUAL_ADJUSTMENT', 'RESTOCK', etc.
    reference_id TEXT, -- e.g. order_id, or optional user note
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In Supabase, RPC functions must be created to handle secure atomic updates.
-- This function takes a product_id and delta, updates the stock atomically, and logs the movement.
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id UUID,
    p_delta NUMERIC,
    p_reason TEXT DEFAULT 'MANUAL_ADJUSTMENT',
    p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $func$
DECLARE
    v_shop_id UUID;
    v_previous_stock NUMERIC;
    v_new_stock NUMERIC;
BEGIN
    -- Optimistically update and return the state
    UPDATE products 
    SET stock_quantity = stock_quantity + p_delta, updated_at = NOW()
    WHERE id = p_product_id
    RETURNING shop_id, (stock_quantity - p_delta), stock_quantity
    INTO v_shop_id, v_previous_stock, v_new_stock;

    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    IF v_new_stock < 0 THEN
        -- Rollback logic (Since Postgres functions are atomic, raising an exception rolls back the whole transaction)
        RAISE EXCEPTION 'Insufficient stock. Required: %, Available: %', abs(p_delta), v_previous_stock;
    END IF;

    -- Log movement
    INSERT INTO stock_movements (shop_id, product_id, quantity_delta, previous_stock, new_stock, reason, reference_id)
    VALUES (v_shop_id, p_product_id, p_delta, v_previous_stock, v_new_stock, p_reason, p_reference_id);

    RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock, 'previous_stock', v_previous_stock);
END;
$func$;
