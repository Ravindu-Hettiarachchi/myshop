-- ============================================================
-- MIGRATION: Sri Lanka Checkout System (2026)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add structured address fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_phone    TEXT,
  ADD COLUMN IF NOT EXISTS customer_street   TEXT,
  ADD COLUMN IF NOT EXISTS customer_district TEXT,
  ADD COLUMN IF NOT EXISTS customer_province TEXT;

-- Backfill: copy customer_address -> customer_street if needed
UPDATE public.orders
SET customer_street = customer_address
WHERE customer_street IS NULL AND customer_address IS NOT NULL;

-- 2. Enforce 5-digit postal code format constraint
-- (Add check; won't break existing rows that already have data)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_postal_code;

ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_postal_code
  CHECK (customer_postal IS NULL OR customer_postal ~ '^\d{5}$');

-- 3. Add phone to shop_customers profile table
ALTER TABLE public.shop_customers
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. Stock Reservations Table (15-minute soft hold)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
    shop_id      UUID NOT NULL REFERENCES public.shops(id)  ON DELETE CASCADE,
    product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id   UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity     DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4a. Enable RLS on stock_reservations
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- 4b. Policies
DROP POLICY IF EXISTS "Users can manage own reservations" ON public.stock_reservations;
CREATE POLICY "Users can manage own reservations"
ON public.stock_reservations FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Shop owners can view reservations for their shop" ON public.stock_reservations;
CREATE POLICY "Shop owners can view reservations for their shop"
ON public.stock_reservations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = stock_reservations.shop_id
      AND s.owner_id = auth.uid()
  )
);

-- 4c. Index for efficient expiry cleanup
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expires
  ON public.stock_reservations (expires_at);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_user_shop
  ON public.stock_reservations (user_id, shop_id);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_product
  ON public.stock_reservations (product_id, expires_at);

-- 5. Auto-cleanup expired reservations function
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.stock_reservations
  WHERE expires_at < NOW();
END;
$$;

-- 6. Scheduled cleanup via pg_cron (run every 5 minutes)
-- Note: Requires pg_cron extension enabled in Supabase dashboard
-- SELECT cron.schedule('cleanup-stock-reservations', '*/5 * * * *', 'SELECT cleanup_expired_reservations()');

-- 7. View: available stock (stock minus active reservations)
CREATE OR REPLACE VIEW public.product_available_stock AS
SELECT
  p.id AS product_id,
  p.shop_id,
  p.title,
  p.stock_quantity,
  COALESCE(
    (SELECT SUM(r.quantity)
     FROM public.stock_reservations r
     WHERE r.product_id = p.id
       AND r.expires_at > NOW()),
    0
  ) AS reserved_quantity,
  GREATEST(0, p.stock_quantity - COALESCE(
    (SELECT SUM(r.quantity)
     FROM public.stock_reservations r
     WHERE r.product_id = p.id
       AND r.expires_at > NOW()),
    0
  )) AS available_quantity
FROM public.products p;

-- 8. Update orders status enum to include 'cancelled' if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancelled'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'cancelled';
  END IF;
END $$;

-- 9. Add packed_at, shipped_at, delivered_at timestamps to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS packed_at    TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS shipped_at   TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- 10. Update order_status enum to include 'packed' if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'packed'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'packed';
  END IF;
END $$;

-- Confirmation
SELECT 'Migration completed successfully.' AS status;
