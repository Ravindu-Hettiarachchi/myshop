-- Add product selling + stock unit support
-- Allowed values: item, kg, g, litre, ml, pack

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS selling_unit TEXT;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS selling_unit_value DECIMAL(10, 3);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS stock_unit TEXT;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS unit TEXT;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS unit_value DECIMAL(10, 3);

-- Backfill selling_unit_value from new/legacy fields
UPDATE products
SET selling_unit_value = COALESCE(selling_unit_value, unit_value, 1)
WHERE selling_unit_value IS NULL OR selling_unit_value <= 0;

ALTER TABLE products
    ALTER COLUMN selling_unit_value SET DEFAULT 1;

ALTER TABLE products
    ALTER COLUMN selling_unit_value SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_selling_unit_value_check;

ALTER TABLE products
    ADD CONSTRAINT products_selling_unit_value_check
    CHECK (selling_unit_value > 0);

UPDATE products
SET unit_value = 1
WHERE unit_value IS NULL OR unit_value <= 0;

ALTER TABLE products
    ALTER COLUMN unit_value SET DEFAULT 1;

ALTER TABLE products
    ALTER COLUMN unit_value SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_unit_value_check;

ALTER TABLE products
    ADD CONSTRAINT products_unit_value_check
    CHECK (unit_value > 0);

-- Backfill selling_unit and stock_unit from new/legacy fields
UPDATE products
SET selling_unit = COALESCE(selling_unit, unit, 'item')
WHERE selling_unit IS NULL OR btrim(selling_unit) = '';

UPDATE products
SET stock_unit = COALESCE(stock_unit, selling_unit, unit, 'item')
WHERE stock_unit IS NULL OR btrim(stock_unit) = '';

ALTER TABLE products
    ALTER COLUMN selling_unit SET DEFAULT 'item';

ALTER TABLE products
    ALTER COLUMN selling_unit SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_selling_unit_check;

ALTER TABLE products
    ADD CONSTRAINT products_selling_unit_check
    CHECK (selling_unit IN ('item', 'kg', 'g', 'litre', 'ml', 'pack'));

ALTER TABLE products
    ALTER COLUMN stock_unit SET DEFAULT 'item';

ALTER TABLE products
    ALTER COLUMN stock_unit SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_stock_unit_check;

ALTER TABLE products
    ADD CONSTRAINT products_stock_unit_check
    CHECK (stock_unit IN ('item', 'kg', 'g', 'litre', 'ml', 'pack'));

UPDATE products
SET unit = 'item'
WHERE unit IS NULL OR btrim(unit) = '';

ALTER TABLE products
    ALTER COLUMN unit SET DEFAULT 'item';

ALTER TABLE products
    ALTER COLUMN unit SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_unit_check;

ALTER TABLE products
    ADD CONSTRAINT products_unit_check
    CHECK (unit IN ('item', 'kg', 'g', 'litre', 'ml', 'pack'));

-- Ensure numeric stock values are non-negative and future-ready for fractional inventory
ALTER TABLE products
    ALTER COLUMN stock_quantity TYPE DECIMAL(12, 3) USING stock_quantity::DECIMAL(12, 3);

UPDATE products
SET stock_quantity = 0
WHERE stock_quantity IS NULL OR stock_quantity < 0;

ALTER TABLE products
    ALTER COLUMN stock_quantity SET DEFAULT 0;

ALTER TABLE products
    ALTER COLUMN stock_quantity SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_stock_quantity_check;

ALTER TABLE products
    ADD CONSTRAINT products_stock_quantity_check
    CHECK (stock_quantity >= 0);

ALTER TABLE products
    ALTER COLUMN low_stock_threshold TYPE DECIMAL(12, 3) USING low_stock_threshold::DECIMAL(12, 3);

UPDATE products
SET low_stock_threshold = 0
WHERE low_stock_threshold IS NULL OR low_stock_threshold < 0;

ALTER TABLE products
    ALTER COLUMN low_stock_threshold SET DEFAULT 5;

ALTER TABLE products
    ALTER COLUMN low_stock_threshold SET NOT NULL;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_low_stock_threshold_check;

ALTER TABLE products
    ADD CONSTRAINT products_low_stock_threshold_check
    CHECK (low_stock_threshold >= 0);
