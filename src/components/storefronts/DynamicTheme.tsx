'use client';

import React from 'react';
import { ShoppingCart, ChevronRight, ArrowRight } from 'lucide-react';
import { formatPriceWithUnit, normalizeSellingUnit, normalizeUnitValue, type ProductUnit } from '@/lib/products';

export interface DynamicThemeConfig {
    // Basic
    bg_color:      string;
    text_color:    string;
    accent_color:  string;
    font_family:   string;
    layout_style:  'minimal' | 'grid' | 'bold' | string;
    card_style:    'rounded' | 'sharp' | 'elevated' | string;
    header_style:  'minimal' | 'centered' | 'colored' | string;
    // Extended Colors
    secondary_color?: string;
    card_bg_color?:   string;
    footer_bg?:       'page' | 'dark' | 'accent' | string;
    // Typography
    heading_font?:  string;
    body_size?:     'sm' | 'md' | 'lg' | string;
    // Buttons
    button_style?:  'filled' | 'outline' | 'soft' | string;
    button_radius?: 'none' | 'sm' | 'md' | 'lg' | 'pill' | string;
    // Cards
    card_image_ratio?:  'square' | 'portrait' | 'landscape' | string;
    card_hover?:        'none' | 'scale' | 'shadow' | 'both' | string;
    show_description?:  boolean;
    // Layout
    hero_style?:    'none' | 'compact' | 'full' | string;
    spacing_scale?: 'compact' | 'normal' | 'spacious' | string;
    sticky_header?: boolean;
    // Footer
    footer_style?:  'minimal' | 'centered' | 'rich' | string;
}

interface Shop {
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
}

interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    image_urls?: string[] | null;
    compare_at_price?: number | null;
    image?: string;
}

interface Props {
    shop: Shop;
    products: Product[];
    onAddToCart: (product: Product) => void;
    onOpenCart: () => void;
    cartCount: number;
    sessionUser: unknown;
    customerDisplayName?: string;
    onLogout?: () => void | Promise<void>;
    themeConfig: DynamicThemeConfig;
}

// ─── Helpers ────────────────────────────────────────────────
function hex2rgb(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
}

function cardBorderRadius(cardStyle: string, scale?: string): string {
    if (cardStyle === 'sharp') return '0px';
    if (cardStyle === 'elevated') return '20px';
    return '12px';
}

function cardShadow(cardStyle: string): string {
    if (cardStyle === 'elevated') return '0 10px 40px rgba(0,0,0,0.14)';
    if (cardStyle === 'sharp') return 'none';
    return '0 2px 8px rgba(0,0,0,0.07)';
}

function buttonRadiusVal(r?: string): string {
    switch (r) {
        case 'none': return '0px';
        case 'sm':   return '6px';
        case 'lg':   return '14px';
        case 'pill': return '9999px';
        default:     return '10px';   // md
    }
}

function imageAspect(ratio?: string): string {
    switch (ratio) {
        case 'portrait':   return '3/4';
        case 'landscape':  return '4/3';
        default:           return '1/1';
    }
}

function sectionPad(spacing?: string): string {
    switch (spacing) {
        case 'compact':   return 'py-6';
        case 'spacious':  return 'py-20';
        default:          return 'py-12';
    }
}

function colsClass(layout?: string): string {
    switch (layout) {
        case 'grid': return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
        case 'bold': return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        default:     return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
}

function bodyFontSize(size?: string): string {
    switch (size) {
        case 'sm':  return '0.85rem';
        case 'lg':  return '1.05rem';
        default:    return '0.95rem';
    }
}

function footerBgColor(footerBg: string | undefined, bgColor: string, accentColor: string): string {
    switch (footerBg) {
        case 'dark':   return '#111111';
        case 'accent': return accentColor;
        default:       return bgColor;
    }
}

function footerTextColor(footerBg: string | undefined, textColor: string): string {
    if (footerBg === 'dark' || footerBg === 'accent') return '#ffffff';
    return textColor;
}

// ─── Component ──────────────────────────────────────────────
export default function DynamicTheme({
    shop, products, onAddToCart, onOpenCart, cartCount, sessionUser, customerDisplayName, onLogout, themeConfig: c
}: Props) {
    const accentRgb = hex2rgb(c.accent_color);
    const secondaryColor = c.secondary_color || '#6366F1';
    const cardBg = c.card_bg_color || c.bg_color;
    const headingFont = c.heading_font || c.font_family;
    const isColoredHeader = c.header_style === 'colored';
    const isCenteredHeader = c.header_style === 'centered';
    const headerBg = isColoredHeader ? c.accent_color : c.bg_color;
    const headerText = isColoredHeader ? '#fff' : c.text_color;
    const isBoldLayout = c.layout_style === 'bold';
    const isHeroFull = c.hero_style === 'full';
    const isHeroNone = c.hero_style === 'none';
    const figPad = sectionPad(c.spacing_scale);
    const btnRadius = buttonRadiusVal(c.button_radius);
    const cardRadius = cardBorderRadius(c.card_style);
    const shadow = cardShadow(c.card_style);
    const cols = colsClass(c.layout_style);
    const aspect = imageAspect(c.card_image_ratio);
    const fBg = footerBgColor(c.footer_bg, c.bg_color, c.accent_color);
    const fText = footerTextColor(c.footer_bg, c.text_color);

    const productList = products.map(p => ({
        ...p,
        selling_unit_value: normalizeUnitValue(p.selling_unit_value),
        selling_unit: normalizeSellingUnit(p.selling_unit),
        image: p.image_urls?.[0] || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    }));

    // ── Button renderer ────────────────────────────────────
    const renderBtn = (label: string, onClick: () => void, disabled = false) => {
        let bg = '', color = '', border = '';
        if (disabled) {
            bg = `rgba(${hex2rgb(c.text_color)},0.08)`;
            color = `rgba(${hex2rgb(c.text_color)},0.35)`;
            border = 'none';
        } else {
            switch (c.button_style) {
                case 'outline':
                    bg = 'transparent';
                    color = c.accent_color;
                    border = `2px solid ${c.accent_color}`;
                    break;
                case 'soft':
                    bg = `rgba(${accentRgb},0.12)`;
                    color = c.accent_color;
                    border = 'none';
                    break;
                default: // filled
                    bg = c.accent_color;
                    color = '#fff';
                    border = 'none';
            }
        }
        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                disabled={disabled}
                style={{ background: bg, color, border, borderRadius: btnRadius, fontSize: bodyFontSize(c.body_size) }}
                className="px-4 py-2 font-bold transition hover:opacity-85 disabled:cursor-not-allowed whitespace-nowrap"
            >{label}</button>
        );
    };

    return (
        <div
            style={{
                fontFamily: `'${c.font_family}', sans-serif`,
                fontSize: bodyFontSize(c.body_size),
                backgroundColor: c.bg_color,
                color: c.text_color,
                minHeight: '100vh',
            }}
        >
            {/* ── Announcement Bar ── */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: secondaryColor, color: '#fff' }} className="text-center text-xs py-2 px-4 font-semibold tracking-wide">
                    {shop.announcement_bar}
                </div>
            )}

            {/* ── Header ── */}
            <header
                style={{
                    backgroundColor: headerBg,
                    color: headerText,
                    borderBottom: `1px solid rgba(${hex2rgb(c.text_color)},0.08)`,
                    position: c.sticky_header !== false ? 'sticky' : 'relative',
                    top: 0,
                    zIndex: 40,
                }}
            >
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center ${isCenteredHeader ? 'relative' : 'gap-6'}`}>
                    {/* Logo */}
                    <div className={`flex items-center gap-3 ${isCenteredHeader ? '' : ''}`}>
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt="logo" className="h-9 w-9 object-contain rounded-lg" />
                        ) : (
                            <div
                                style={{
                                    background: isColoredHeader
                                        ? `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))`
                                        : `linear-gradient(135deg, ${c.accent_color}, ${secondaryColor})`,
                                    color: '#fff',
                                    borderRadius: btnRadius,
                                }}
                                className="h-9 w-9 flex items-center justify-center font-extrabold text-lg shadow-sm"
                            >
                                {shop.shop_name[0]}
                            </div>
                        )}
                        {!isCenteredHeader && (
                            <span style={{ fontFamily: `'${headingFont}', serif`, color: headerText }} className="font-extrabold text-lg tracking-tight">
                                {shop.shop_name}
                            </span>
                        )}
                    </div>

                    {isCenteredHeader && (
                        <span
                            style={{ fontFamily: `'${headingFont}', serif`, color: headerText }}
                            className="font-extrabold text-lg tracking-tight absolute left-1/2 -translate-x-1/2"
                        >
                            {shop.shop_name}
                        </span>
                    )}

                    {/* Right Nav */}
                    <div className={`flex items-center gap-3 ${isCenteredHeader ? 'ml-auto' : 'ml-auto'}`}>
                        <button onClick={onOpenCart} style={{ color: headerText }} className="relative p-2 hover:opacity-70 transition">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span
                                    style={{ backgroundColor: isColoredHeader ? '#fff' : c.accent_color, color: isColoredHeader ? c.accent_color : '#fff' }}
                                    className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center font-bold"
                                >
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        {sessionUser ? (
                            <>
                                <a
                                    href={`/shop/${shop.route_path}/orders`}
                                    style={{ color: headerText }}
                                    className="text-sm font-semibold hover:opacity-70 transition hidden sm:block"
                                >{customerDisplayName || 'Account'}</a>
                                <a
                                    href={`/shop/${shop.route_path}/orders`}
                                    style={{ color: headerText }}
                                    className="text-sm font-semibold hover:opacity-70 transition hidden sm:block"
                                >My Orders</a>
                                <button
                                    onClick={onLogout}
                                    style={{ color: headerText }}
                                    className="text-sm font-semibold hover:opacity-70 transition hidden sm:block"
                                >Logout</button>
                            </>
                        ) : (
                            <>
                                <a
                                    href={`/shop/${shop.route_path}/login`}
                                    style={{ color: headerText }}
                                    className="text-sm font-semibold hover:opacity-70 transition hidden sm:block"
                                >Login</a>
                                <a
                                    href={`/shop/${shop.route_path}/signup`}
                                    style={{ color: headerText }}
                                    className="text-sm font-semibold hover:opacity-70 transition hidden sm:block"
                                >Signup</a>
                                <a
                                    href={`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/orders`)}`}
                                    style={{
                                        background: isColoredHeader ? 'rgba(255,255,255,0.2)' : c.accent_color,
                                        color: '#fff',
                                        borderRadius: btnRadius,
                                        border: c.button_style === 'outline' && !isColoredHeader ? `2px solid ${c.accent_color}` : 'none',
                                    }}
                                    className="text-xs font-bold px-4 py-2 transition hover:opacity-85 hidden sm:block"
                                >My Orders</a>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Hero Section ── */}
            {!isHeroNone && (
                <section
                    style={{
                        background: shop.banner_url
                            ? `url(${shop.banner_url}) center/cover no-repeat`
                            : `linear-gradient(135deg, rgba(${accentRgb},0.10) 0%, rgba(${hex2rgb(secondaryColor)},0.06) 100%)`,
                        minHeight: isHeroFull ? '480px' : isBoldLayout ? '380px' : '160px',
                    }}
                    className="flex items-center"
                >
                    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${isHeroFull || isBoldLayout ? 'py-20' : 'py-10'}`}>
                        <div
                            style={{
                                background: shop.banner_url && (isHeroFull || isBoldLayout) ? 'rgba(0,0,0,0.52)' : 'transparent',
                                borderRadius: c.card_style === 'sharp' ? '0' : '20px',
                                padding: shop.banner_url && (isHeroFull || isBoldLayout) ? '2.5rem 3rem' : '0',
                                display: 'inline-block',
                                maxWidth: '640px',
                            }}
                        >
                            <h1
                                style={{
                                    fontFamily: `'${headingFont}', serif`,
                                    color: shop.banner_url ? '#fff' : c.text_color,
                                    fontSize: isHeroFull ? 'clamp(2.5rem, 6vw, 4.5rem)' : isBoldLayout ? 'clamp(2rem, 5vw, 3.5rem)' : 'clamp(1.5rem, 4vw, 2.5rem)',
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                }}
                                className="mb-4"
                            >
                                {shop.shop_name}
                            </h1>
                            {shop.tagline && (
                                <p
                                    style={{
                                        color: shop.banner_url ? 'rgba(255,255,255,0.87)' : `rgba(${hex2rgb(c.text_color)},0.62)`,
                                        fontSize: isHeroFull ? '1.15rem' : '1rem',
                                    }}
                                    className="mb-8 max-w-lg leading-relaxed"
                                >
                                    {shop.tagline}
                                </p>
                            )}
                            {(isHeroFull || isBoldLayout) && (
                                <button
                                    onClick={onOpenCart}
                                    style={{
                                        background: c.button_style === 'outline'
                                            ? 'transparent'
                                            : c.button_style === 'soft'
                                                ? `rgba(${accentRgb},0.15)`
                                                : c.accent_color,
                                        color: c.button_style === 'filled' ? '#fff' : shop.banner_url ? '#fff' : c.accent_color,
                                        border: c.button_style === 'outline' ? '2px solid ' + (shop.banner_url ? '#fff' : c.accent_color) : 'none',
                                        borderRadius: btnRadius,
                                    }}
                                    className="px-8 py-3.5 font-bold hover:opacity-85 transition flex items-center gap-2"
                                >
                                    Shop Now <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Products Section ── */}
            <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${figPad}`}>
                {/* Grid header */}
                <div className="flex items-center justify-between mb-8">
                    <h2
                        style={{ fontFamily: `'${headingFont}', serif`, color: c.text_color, fontWeight: 800 }}
                        className={c.layout_style === 'grid' ? 'text-xl' : 'text-2xl'}
                    >
                        {isBoldLayout ? 'Featured Products' : 'All Products'}
                    </h2>
                    <span style={{ color: `rgba(${hex2rgb(c.text_color)},0.40)` }} className="text-sm">
                        {productList.length} {productList.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                {productList.length === 0 ? (
                    <div className="py-24 text-center">
                        <p style={{ color: `rgba(${hex2rgb(c.text_color)},0.40)` }}>No products yet — check back soon!</p>
                    </div>
                ) : (
                    <div className={`grid ${cols} gap-${c.spacing_scale === 'compact' ? '4' : c.spacing_scale === 'spacious' ? '8' : '6'}`}>
                        {productList.map(product => {
                            const outOfStock = product.stock_quantity === 0;
                            const lowStock = !outOfStock && product.stock_quantity <= 5;
                            const hoverCls =
                                c.card_hover === 'scale' ? 'group-hover:scale-105' :
                                c.card_hover === 'both'  ? 'group-hover:scale-105' : '';

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => onAddToCart(product)}
                                    style={{
                                        backgroundColor: cardBg,
                                        borderRadius: cardRadius,
                                        boxShadow: c.card_hover === 'shadow' || c.card_hover === 'both'
                                            ? undefined
                                            : shadow,
                                        border: c.card_style === 'sharp'
                                            ? `1px solid rgba(${hex2rgb(c.text_color)},0.12)`
                                            : c.card_style === 'elevated'
                                                ? 'none'
                                                : `1px solid rgba(${hex2rgb(c.text_color)},0.07)`,
                                        transition: 'box-shadow 0.25s, transform 0.25s',
                                    }}
                                    className={`group flex flex-col overflow-hidden cursor-pointer
                                        ${c.card_hover === 'shadow' ? 'hover:shadow-2xl' : ''}
                                        ${c.card_hover === 'both'   ? 'hover:shadow-2xl' : ''}
                                    `}
                                >
                                    {/* Image */}
                                    <div
                                        className="relative overflow-hidden"
                                        style={{ aspectRatio: aspect }}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className={`w-full h-full object-cover transition-transform duration-500 ${hoverCls}`}
                                        />
                                        {outOfStock && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold bg-black/55 px-3 py-1.5 rounded-full">Out of Stock</span>
                                            </div>
                                        )}
                                        {lowStock && (
                                            <span
                                                style={{ backgroundColor: secondaryColor }}
                                                className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
                                            >
                                                Only {product.stock_quantity} left
                                            </span>
                                        )}
                                        {product.compare_at_price != null && product.compare_at_price > product.price && (
                                            <span
                                                style={{ backgroundColor: c.accent_color }}
                                                className="absolute top-3 right-3 text-white text-xs font-extrabold px-2.5 py-1 rounded-sm shadow-md"
                                            >
                                                {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div
                                        style={{ padding: c.spacing_scale === 'compact' ? '0.75rem' : c.spacing_scale === 'spacious' ? '1.5rem' : '1rem' }}
                                        className="flex flex-col flex-1"
                                    >
                                        <h3
                                            style={{ fontFamily: `'${headingFont}', serif`, color: c.text_color, fontWeight: 700 }}
                                            className="text-sm leading-snug line-clamp-2"
                                        >
                                            {product.title}
                                        </h3>

                                        {c.show_description !== false && product.description && c.layout_style !== 'grid' && (
                                            <p
                                                style={{ color: `rgba(${hex2rgb(c.text_color)},0.52)`, fontSize: '0.78rem' }}
                                                className="mt-1.5 mb-2 line-clamp-2 leading-relaxed"
                                            >
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-3 gap-2 flex-wrap">
                                            <div>
                                                {product.compare_at_price != null && product.compare_at_price > product.price && (
                                                    <p style={{ color: `rgba(${hex2rgb(c.text_color)},0.4)` }} className="text-xs font-bold line-through">
                                                        Rs. {Number(product.compare_at_price).toLocaleString()}
                                                    </p>
                                                )}
                                                <p style={{ color: c.accent_color, fontWeight: 800 }} className="text-base">
                                                    {formatPriceWithUnit(Number(product.price), product.selling_unit, product.selling_unit_value)}
                                                </p>
                                            </div>
                                            {renderBtn(outOfStock ? 'Sold Out' : 'Add to Cart', () => onAddToCart(product), outOfStock)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Footer ── */}
            <footer
                style={{
                    backgroundColor: fBg,
                    color: fText,
                    borderTop: `1px solid rgba(${hex2rgb(c.text_color)},0.08)`,
                    marginTop: c.spacing_scale === 'spacious' ? '5rem' : '3rem',
                }}
                className="py-10"
            >
                {c.footer_style === 'rich' ? (
                    /* Rich footer — 3 columns */
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div style={{ background: c.accent_color, borderRadius: btnRadius }} className="w-7 h-7 flex items-center justify-center text-white font-bold text-sm">
                                        {shop.shop_name[0]}
                                    </div>
                                    <span style={{ fontFamily: `'${headingFont}', serif`, color: fText }} className="font-extrabold">{shop.shop_name}</span>
                                </div>
                                {shop.tagline && <p style={{ color: `rgba(${hex2rgb(fText)},0.60)` }} className="text-sm leading-relaxed">{shop.tagline}</p>}
                            </div>
                            <div>
                                <p style={{ color: fText, fontWeight: 700 }} className="text-sm mb-3">Quick Links</p>
                                <ul className="space-y-2">
                                    {['Browse Products', 'My Account', 'Track Order'].map(link => (
                                        <li key={link}>
                                            <a href="#" style={{ color: `rgba(${hex2rgb(fText)},0.60)` }} className="text-sm hover:opacity-100 transition flex items-center gap-1">
                                                <ArrowRight className="w-3 h-3" /> {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p style={{ color: fText, fontWeight: 700 }} className="text-sm mb-3">Contact</p>
                                {shop.footer_text && <p style={{ color: `rgba(${hex2rgb(fText)},0.60)` }} className="text-sm leading-relaxed">{shop.footer_text}</p>}
                                <div className="flex gap-2 mt-3">
                                    {['FB', 'IG', 'TW'].map(s => (
                                        <div key={s} style={{ background: `rgba(${hex2rgb(fText)},0.12)`, color: fText, borderRadius: btnRadius }} className="w-8 h-8 flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-70 transition">{s}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ borderTop: `1px solid rgba(${hex2rgb(fText)},0.12)` }} className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                            <p style={{ color: `rgba(${hex2rgb(fText)},0.45)` }} className="text-xs">© {new Date().getFullYear()} {shop.shop_name}. All rights reserved.</p>
                            <p style={{ color: `rgba(${hex2rgb(fText)},0.35)` }} className="text-xs">Powered by <span style={{ color: c.accent_color }} className="font-semibold">MyShop</span></p>
                        </div>
                    </div>
                ) : c.footer_style === 'centered' ? (
                    /* Centered footer */
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <div style={{ background: c.accent_color, borderRadius: btnRadius }} className="w-10 h-10 mx-auto mb-3 flex items-center justify-center text-white font-extrabold text-lg">
                            {shop.shop_name[0]}
                        </div>
                        <p style={{ fontFamily: `'${headingFont}', serif`, color: fText, fontWeight: 800 }} className="text-base mb-1">{shop.shop_name}</p>
                        {shop.footer_text && <p style={{ color: `rgba(${hex2rgb(fText)},0.55)` }} className="text-sm mb-4">{shop.footer_text}</p>}
                        <p style={{ color: `rgba(${hex2rgb(fText)},0.40)` }} className="text-xs">© {new Date().getFullYear()} {shop.shop_name} · Powered by <span style={{ color: c.accent_color }} className="font-semibold">MyShop</span></p>
                    </div>
                ) : (
                    /* Minimal footer */
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div style={{ background: c.accent_color, borderRadius: btnRadius }} className="w-6 h-6 flex items-center justify-center text-white font-bold text-xs">
                                {shop.shop_name[0]}
                            </div>
                            <span style={{ fontFamily: `'${headingFont}', serif`, color: fText }} className="font-bold text-sm">{shop.shop_name}</span>
                        </div>
                        <p style={{ color: `rgba(${hex2rgb(fText)},0.45)` }} className="text-xs text-center">
                            {shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}`}
                        </p>
                        <p style={{ color: `rgba(${hex2rgb(fText)},0.35)` }} className="text-xs">Powered by <span style={{ color: c.accent_color }} className="font-semibold">MyShop</span></p>
                    </div>
                )}
            </footer>
        </div>
    );
}
