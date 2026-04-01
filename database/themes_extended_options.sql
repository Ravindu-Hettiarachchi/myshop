-- ============================================================
-- Extended Theme Builder Options
-- Run this AFTER themes_custom_columns.sql
-- ============================================================

-- Section 1: Extended Colors
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7)  DEFAULT '#6366F1', -- gradients / badges
    ADD COLUMN IF NOT EXISTS card_bg_color   VARCHAR(7)  DEFAULT '#FFFFFF', -- card background
    ADD COLUMN IF NOT EXISTS footer_bg       VARCHAR(20) DEFAULT 'page';    -- 'page' | 'dark' | 'accent'

-- Section 2: Typography
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS heading_font   VARCHAR(50)  DEFAULT 'Inter',   -- separate heading font
    ADD COLUMN IF NOT EXISTS body_size      VARCHAR(10)  DEFAULT 'md';      -- 'sm' | 'md' | 'lg'

-- Section 3: Buttons
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS button_style  VARCHAR(20)  DEFAULT 'filled',   -- 'filled' | 'outline' | 'soft'
    ADD COLUMN IF NOT EXISTS button_radius VARCHAR(20)  DEFAULT 'md';       -- 'none' | 'sm' | 'md' | 'lg' | 'pill'

-- Section 4: Cards
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS card_image_ratio  VARCHAR(10)  DEFAULT 'square',  -- 'square' | 'portrait' | 'landscape'
    ADD COLUMN IF NOT EXISTS card_hover        VARCHAR(20)  DEFAULT 'scale',   -- 'none' | 'scale' | 'shadow' | 'both'
    ADD COLUMN IF NOT EXISTS show_description  BOOLEAN      DEFAULT TRUE;

-- Section 5: Layout
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS hero_style     VARCHAR(20)  DEFAULT 'compact',  -- 'none' | 'compact' | 'full'
    ADD COLUMN IF NOT EXISTS spacing_scale  VARCHAR(10)  DEFAULT 'normal',   -- 'compact' | 'normal' | 'spacious'
    ADD COLUMN IF NOT EXISTS sticky_header  BOOLEAN      DEFAULT TRUE;

-- Section 6: Footer
ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS footer_style  VARCHAR(20)  DEFAULT 'minimal';   -- 'minimal' | 'centered' | 'rich'
