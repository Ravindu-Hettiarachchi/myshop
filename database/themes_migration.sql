-- ============================================================
-- Theme Management Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the themes table
CREATE TABLE IF NOT EXISTS public.themes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(100) UNIQUE NOT NULL,   -- matches the key in src/lib/themes.ts registry
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    preview_color VARCHAR(7) DEFAULT '#3B82F6', -- HEX color for admin preview swatch
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (safe to re-run)
DROP POLICY IF EXISTS "Admins can manage all themes" ON public.themes;
CREATE POLICY "Admins can manage all themes" ON public.themes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.owners WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Authenticated users can view active themes" ON public.themes;
CREATE POLICY "Authenticated users can view active themes" ON public.themes
    FOR SELECT USING (is_active = TRUE AND auth.role() = 'authenticated');

-- 4. Seed the 4 existing storefront themes
INSERT INTO public.themes (slug, name, description, preview_color, is_active) VALUES
    ('minimal-white',    'Minimal White',    'Clean Apple-style design. Perfect for all product types.', '#3B82F6', TRUE),
    ('modern-dark',      'Modern Dark',      'Bold dark theme with neon accents. Ideal for tech & lifestyle.', '#6366F1', TRUE),
    ('vibrant-market',   'Vibrant Market',   'Colorful and energetic. Great for food, crafts, and general retail.', '#F59E0B', TRUE),
    ('elegant-boutique', 'Elegant Boutique', 'Luxury serif-driven design. Perfect for fashion and premium goods.', '#7C3AED', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 5. Helper: auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER themes_updated_at
    BEFORE UPDATE ON public.themes
    FOR EACH ROW EXECUTE FUNCTION public.update_themes_updated_at();
