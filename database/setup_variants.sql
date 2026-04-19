-- 1. Modify products table to support variant definitions
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS variation_options JSONB DEFAULT '[]'::jsonb;

-- 2. Create the standalone variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    options JSONB NOT NULL, -- e.g. {"Size": "L", "Color": "Red"}
    sku TEXT,
    price_override NUMERIC,
    stock_quantity NUMERIC DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modify telemetry to link to the specific variant
ALTER TABLE stock_movements
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- 4. Rewrite the atomic stock adjuster to route dynamically
CREATE OR REPLACE FUNCTION adjust_stock(
    p_product_id UUID,
    p_delta NUMERIC,
    p_reason TEXT DEFAULT 'MANUAL_ADJUSTMENT',
    p_reference_id TEXT DEFAULT NULL,
    p_variant_id UUID DEFAULT NULL
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
    IF p_variant_id IS NOT NULL THEN
        -- Adjust variant stock atomically
        UPDATE product_variants 
        SET stock_quantity = stock_quantity + p_delta
        WHERE id = p_variant_id AND product_id = p_product_id
        RETURNING (stock_quantity - p_delta), stock_quantity
        INTO v_previous_stock, v_new_stock;

        IF v_previous_stock IS NULL THEN
            RAISE EXCEPTION 'Variant not found';
        END IF;

        IF v_new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient variant stock. Required: %, Available: %', abs(p_delta), v_previous_stock;
        END IF;

        -- Fetch shop_id for the log and touch the main product timestamp
        UPDATE products 
        SET updated_at = NOW() 
        WHERE id = p_product_id 
        RETURNING shop_id INTO v_shop_id;

    ELSE
        -- Adjust base product stock atomically
        UPDATE products 
        SET stock_quantity = stock_quantity + p_delta, updated_at = NOW()
        WHERE id = p_product_id
        RETURNING shop_id, (stock_quantity - p_delta), stock_quantity
        INTO v_shop_id, v_previous_stock, v_new_stock;

        IF v_shop_id IS NULL THEN
            RAISE EXCEPTION 'Product not found';
        END IF;

        IF v_new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient product stock. Required: %, Available: %', abs(p_delta), v_previous_stock;
        END IF;
    END IF;

    -- Log movement accurately tracking either product or variant
    INSERT INTO stock_movements (shop_id, product_id, variant_id, quantity_delta, previous_stock, new_stock, reason, reference_id)
    VALUES (v_shop_id, p_product_id, p_variant_id, p_delta, v_previous_stock, v_new_stock, p_reason, p_reference_id);

    RETURN jsonb_build_object('success', true, 'new_stock', v_new_stock, 'previous_stock', v_previous_stock);
END;
$func$;
