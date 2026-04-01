-- ============================================================
-- Dual-Mode Theme System — Column Migration
-- Run this AFTER the original themes_migration.sql
-- ============================================================

ALTER TABLE public.themes
    ADD COLUMN IF NOT EXISTS theme_type   VARCHAR(10)  DEFAULT 'coded',
    ADD COLUMN IF NOT EXISTS bg_color     VARCHAR(7)   DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS text_color   VARCHAR(7)   DEFAULT '#111111',
    ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7)   DEFAULT '#3B82F6',
    ADD COLUMN IF NOT EXISTS font_family  VARCHAR(50)  DEFAULT 'Inter',
    ADD COLUMN IF NOT EXISTS layout_style VARCHAR(20)  DEFAULT 'minimal',
    ADD COLUMN IF NOT EXISTS card_style   VARCHAR(20)  DEFAULT 'rounded',
    ADD COLUMN IF NOT EXISTS header_style VARCHAR(20)  DEFAULT 'minimal';

-- theme_type values: 'coded' | 'custom'
-- layout_style values: 'minimal' | 'grid' | 'bold'
-- card_style values:   'rounded' | 'sharp' | 'elevated'
-- header_style values: 'minimal' | 'centered' | 'colored'

-- Mark the 4 existing themes as 'coded'
UPDATE public.themes SET theme_type = 'coded'
WHERE slug IN ('minimal-white', 'modern-dark', 'vibrant-market', 'elegant-boutique');
