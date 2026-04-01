/**
 * Theme Registry
 *
 * This is the single source of truth for all storefronts.
 * To add a new theme:
 *  1. Create a new component in /src/components/storefronts/YourTheme.tsx
 *  2. Import it below and add an entry to THEME_REGISTRY.
 *  3. Run the themes_migration.sql (or INSERT into the `themes` table) to make
 *     it visible to admin and shop owners.
 */

import MinimalWhite from '@/components/storefronts/MinimalWhite';
import ModernDark from '@/components/storefronts/ModernDark';
import VibrantMarket from '@/components/storefronts/VibrantMarket';
import ElegantBoutique from '@/components/storefronts/ElegantBoutique';
import React from 'react';

// Common props all storefront components receive
export interface StorefrontProps {
    shop: {
        id: string;
        shop_name: string;
        route_path: string;
        template: string;
        tagline: string | null;
        primary_color: string;
        font: string;
        banner_url: string | null;
        logo_url: string | null;
        announcement_bar: string | null;
        footer_text: string | null;
        tax_rate?: number;
    };
    products: any[];
    onAddToCart: (product: any) => void;
    onOpenCart: () => void;
    cartCount: number;
    sessionUser: any;
}

// Theme metadata used in the registry (code-side only, not from DB)
export interface ThemeRegistryEntry {
    /** Human-readable name shown only as a fallback if DB row is missing */
    name: string;
    /** The React component that renders this theme */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: React.ComponentType<any>;
    /** Whether this is a dark-background theme (affects cart panel colors) */
    isDark?: boolean;
}

/**
 * THEME_REGISTRY maps the slug stored in `themes.slug` (and `shops.template`)
 * to a React component.  Slugs must exactly match what is stored in Supabase.
 */
export const THEME_REGISTRY: Record<string, ThemeRegistryEntry> = {
    'minimal-white': {
        name: 'Minimal White',
        component: MinimalWhite,
        isDark: false,
    },
    'modern-dark': {
        name: 'Modern Dark',
        component: ModernDark,
        isDark: true,
    },
    'vibrant-market': {
        name: 'Vibrant Market',
        component: VibrantMarket,
        isDark: false,
    },
    'elegant-boutique': {
        name: 'Elegant Boutique',
        component: ElegantBoutique,
        isDark: false,
    },
};

/**
 * Returns the registered component for the given slug.
 * Falls back to MinimalWhite if the slug is unknown.
 */
export function getThemeComponent(slug: string): React.ComponentType<StorefrontProps> {
    return THEME_REGISTRY[slug]?.component ?? MinimalWhite;
}

/**
 * Returns true if the given slug is a dark theme.
 */
export function isThemeDark(slug: string): boolean {
    return THEME_REGISTRY[slug]?.isDark ?? false;
}

/**
 * Returns all slugs registered in code — useful for the admin panel
 * to show which theme slugs are available to be registered in the DB.
 */
export function getRegisteredSlugs(): string[] {
    return Object.keys(THEME_REGISTRY);
}
