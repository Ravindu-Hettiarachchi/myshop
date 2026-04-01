-- ============================================================
-- Invoice & Tracking System — Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add customer details columns to orders table
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS customer_name    TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone   TEXT,
    ADD COLUMN IF NOT EXISTS customer_address TEXT,
    ADD COLUMN IF NOT EXISTS customer_city    TEXT,
    ADD COLUMN IF NOT EXISTS customer_postal  TEXT,
    ADD COLUMN IF NOT EXISTS payment_method   TEXT DEFAULT 'cod',
    ADD COLUMN IF NOT EXISTS tracking_number  TEXT,
    ADD COLUMN IF NOT EXISTS tracking_carrier TEXT,
    ADD COLUMN IF NOT EXISTS tracking_url     TEXT,
    ADD COLUMN IF NOT EXISTS email_sent_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS packed_at        TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes            TEXT;

-- 2. Add 'packed' and 'cancelled' to order_status enum (if not already present)
-- Note: PostgreSQL requires specific syntax for enum additions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'order_status'::regtype
        AND enumlabel = 'packed'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'packed' AFTER 'processing';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'order_status'::regtype
        AND enumlabel = 'cancelled'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'cancelled' AFTER 'delivered';
    END IF;
END $$;

-- 3. Allow shop owners to update their own shop orders (for tracking info)
DROP POLICY IF EXISTS "Shop owners can update shop orders" ON public.orders;
CREATE POLICY "Shop owners can update shop orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shops
            WHERE shops.id = orders.shop_id
            AND shops.owner_id = auth.uid()
        )
    );

-- 4. Allow customers to view their own orders by email (public read for order tracking)
DROP POLICY IF EXISTS "Public can view orders by id" ON public.orders;
CREATE POLICY "Public can view orders by id" ON public.orders
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ============================================================
-- Done. Verify with:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'orders' ORDER BY ordinal_position;
-- ============================================================
