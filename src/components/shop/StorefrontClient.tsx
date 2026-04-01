'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getThemeComponent, isThemeDark } from '@/lib/themes';
import DynamicTheme, { type DynamicThemeConfig } from '@/components/storefronts/DynamicTheme';
import { formatPriceWithUnit, formatQuantityLabel, normalizeSellingUnit, normalizeStockUnit, normalizeUnitValue, type ProductUnit } from '@/lib/products';
import type { User } from '@supabase/supabase-js';

interface Product {
    id: string;
    title: string;
    price: number;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    stock_unit: ProductUnit;
    image?: string;
    description: string;
    image_urls?: string[];
}

interface CartItem extends Product {
    quantityMultiplier: number;
    orderedQuantity: number;
    orderedUnit: ProductUnit;
}

interface StorefrontProduct {
    id: string;
    title: string;
    description: string | null;
    price: number;
    selling_unit_value: number | string | null;
    selling_unit: string | null;
    stock_quantity: number;
    stock_unit: string | null;
    unit_value?: number | string | null;
    unit?: string | null;
    image_urls?: string[] | null;
}

interface ShopConfig {
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
}

interface ThemeConfigRow {
    theme_type: 'coded' | 'custom';
    bg_color: string;
    text_color: string;
    accent_color: string;
    font_family: string;
    layout_style: string;
    card_style: string;
    header_style: string;
}

interface Props {
    routePath: string;
    shopConfig: ShopConfig;
    productList: StorefrontProduct[];
    sessionUserInit: User | null;
    themeConfig?: ThemeConfigRow | null;
}

export default function StorefrontClient({ routePath, shopConfig, productList, sessionUserInit, themeConfig }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [sessionUser, setSessionUser] = useState<User | null>(sessionUserInit);
    const [productPicker, setProductPicker] = useState<{ product: Product; quantityMultiplier: number } | null>(null);

    // Initial mapping of products from backend format to Cart format
    const products: Product[] = productList.map(p => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        selling_unit_value: normalizeUnitValue(p.selling_unit_value ?? p.unit_value),
        selling_unit: normalizeSellingUnit(p.selling_unit ?? p.unit),
        stock_quantity: p.stock_quantity,
        stock_unit: normalizeStockUnit(p.stock_unit ?? p.selling_unit ?? p.unit),
        description: p.description || '',
        image_urls: p.image_urls || undefined,
        image: p.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80',
    }));

    const isCartProduct = (value: unknown): value is Product => {
        if (!value || typeof value !== 'object') return false;
        const candidate = value as Partial<Product>;
        return (
            typeof candidate.id === 'string' &&
            typeof candidate.title === 'string' &&
            typeof candidate.price === 'number' &&
            typeof candidate.selling_unit_value === 'number' &&
            typeof candidate.stock_quantity === 'number'
        );
    };

    useEffect(() => {
        const fetchStoreData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSessionUser(session.user);
            }
        };
        fetchStoreData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openProductPicker = (productInput: unknown) => {
        if (!isCartProduct(productInput)) return;
        const product = productInput;
        setProductPicker({ product, quantityMultiplier: 1 });
    };

    const getMaxMultiplier = (product: Product) => {
        const perPack = normalizeUnitValue(product.selling_unit_value);
        if (perPack <= 0) return 0;
        return Math.max(0, Math.floor(product.stock_quantity / perPack));
    };

    const addSelectedToCart = () => {
        if (!productPicker) return;
        const { product, quantityMultiplier } = productPicker;
        const maxMultiplier = getMaxMultiplier(product);

        if (maxMultiplier <= 0) return;
        const safeMultiplier = Math.min(maxMultiplier, Math.max(1, quantityMultiplier));
        const requestedQuantity = normalizeUnitValue(product.selling_unit_value) * safeMultiplier;

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                const newMultiplier = existing.quantityMultiplier + safeMultiplier;
                const cappedMultiplier = Math.min(newMultiplier, maxMultiplier);
                return prev.map(item => item.id === product.id
                    ? {
                        ...item,
                        quantityMultiplier: cappedMultiplier,
                        orderedQuantity: normalizeUnitValue(item.selling_unit_value) * cappedMultiplier,
                    }
                    : item);
            }
            return [...prev, {
                ...product,
                image: product.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80',
                quantityMultiplier: safeMultiplier,
                orderedQuantity: requestedQuantity,
                orderedUnit: product.selling_unit,
            }];
        });
        setProductPicker(null);
        setIsCartOpen(true);
    };

    const updateItemMultiplier = (productId: string, nextMultiplier: number) => {
        setCart(prev => prev.flatMap(item => {
            if (item.id !== productId) return [item];
            const maxMultiplier = getMaxMultiplier(item);
            const safeMultiplier = Math.min(maxMultiplier, Math.max(0, nextMultiplier));
            if (safeMultiplier === 0) return [];
            return [{
                ...item,
                quantityMultiplier: safeMultiplier,
                orderedQuantity: normalizeUnitValue(item.selling_unit_value) * safeMultiplier,
            }];
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantityMultiplier), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantityMultiplier, 0);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Force a strict real-time session check
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            alert('You must be logged in to securely place an order. Redirecting you to login...');
            router.push(`/shop/${routePath}/login?next=${encodeURIComponent(`/shop/${routePath}/checkout`)}`);
            return;
        }

        if (!shopConfig || cart.length === 0) return;

        // Save cart state to local storage to be read by the checkout page
        setIsCheckingOut(true);
        try {
            localStorage.setItem(`myshop_cart_${shopConfig.id}`, JSON.stringify(cart));
            router.push(`/shop/${routePath}/checkout`);
        } catch (e) {
            console.error("Failed to transition to checkout", e);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSessionUser(null);
        router.push(`/shop/${routePath}`);
        router.refresh();
    };

    const customerDisplayName = sessionUser?.user_metadata?.full_name || sessionUser?.email?.split('@')[0] || 'Account';

    // Render Logic — custom DB-driven theme OR coded registry theme
    const renderTemplate = () => {
        const enrichedConfig = { ...shopConfig, route_path: routePath };

        // Custom theme: use the DynamicTheme renderer with DB config
        if (themeConfig?.theme_type === 'custom') {
            const dynamicCfg: DynamicThemeConfig = {
                bg_color:     themeConfig.bg_color     || '#FFFFFF',
                text_color:   themeConfig.text_color   || '#111111',
                accent_color: themeConfig.accent_color || shopConfig.primary_color || '#3B82F6',
                font_family:  themeConfig.font_family  || shopConfig.font || 'Inter',
                layout_style: themeConfig.layout_style || 'minimal',
                card_style:   themeConfig.card_style   || 'rounded',
                header_style: themeConfig.header_style || 'minimal',
            };
            return (
                <DynamicTheme
                    shop={enrichedConfig}
                    products={products}
                    onAddToCart={openProductPicker}
                    onOpenCart={() => setIsCartOpen(true)}
                    cartCount={cartCount}
                    sessionUser={sessionUser}
                    customerDisplayName={customerDisplayName}
                    onLogout={handleLogout}
                    themeConfig={dynamicCfg}
                />
            );
        }

        // Coded theme: use the registry component
        const ThemeComponent = getThemeComponent(shopConfig.template);
        return (
            <ThemeComponent
                shop={enrichedConfig}
                products={products}
                onAddToCart={openProductPicker}
                onOpenCart={() => setIsCartOpen(true)}
                cartCount={cartCount}
                sessionUser={sessionUser}
                customerDisplayName={customerDisplayName}
                onLogout={handleLogout}
            />
        );
    };

    const isDarkTheme = isThemeDark(shopConfig.template);
    const shopName = shopConfig.shop_name;
    const theme = {
        cardBg: isDarkTheme ? 'bg-gray-900' : 'bg-white',
        text: isDarkTheme ? 'text-gray-100' : 'text-gray-900',
        textMuted: isDarkTheme ? 'text-gray-400' : 'text-gray-600',
        cardBorder: isDarkTheme ? 'border-gray-800' : 'border-gray-100',
        buttonBg: isDarkTheme ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
        cartOverlay: isDarkTheme ? 'bg-black/80' : 'bg-gray-900/40',
        cartPanel: isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    };

    return (
        <div className="relative font-sans">
            {/* Fully delegated Storefront Template Rendering */}
            {renderTemplate()}

            {/* Cart Slide-Over Modal - Global Overlays */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className={`absolute inset-0 ${theme.cartOverlay} backdrop-blur-[2px] transition-opacity`} onClick={() => setIsCartOpen(false)}></div>
                    <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
                        <div className={`w-full h-full flex flex-col ${theme.cartPanel} shadow-2xl border-l transform transition-transform`}>

                            {/* Cart Header */}
                            <div className={`flex items-center justify-between p-6 border-b ${theme.cardBorder}`}>
                                <h2 className={`text-xl font-bold ${theme.text}`}>Your Checkout ({cartCount})</h2>
                                <button onClick={() => setIsCartOpen(false)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme.textMuted}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cart.length === 0 ? (
                                    <div className={`text-center py-12 ${theme.textMuted}`}>
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Your cart is completely empty.</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img src={item.image || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80'} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className={`font-bold ${theme.text} line-clamp-2`}>{item.title}</h4>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className={`${theme.textMuted} text-sm mt-1`}>{formatQuantityLabel(item.orderedQuantity, item.orderedUnit)}</p>
                                                <p className={`font-bold ${theme.text} mt-2`}>රු {(item.price * item.quantityMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                <p className={`${theme.textMuted} text-xs mt-0.5`}>{formatPriceWithUnit(item.price, item.selling_unit, item.selling_unit_value)} · Qty x{item.quantityMultiplier}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateItemMultiplier(item.id, item.quantityMultiplier - 1)}
                                                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className={`text-xs font-semibold ${theme.textMuted}`}>{item.quantityMultiplier}</span>
                                                    <button
                                                        onClick={() => updateItemMultiplier(item.id, item.quantityMultiplier + 1)}
                                                        className="w-6 h-6 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Cart Footer (Checkout) */}
                            {cart.length > 0 && (
                                <div className={`p-6 border-t ${theme.cardBorder} bg-opacity-50`}>
                                    <div className="flex justify-between mb-4">
                                        <span className={`font-bold ${theme.textMuted}`}>Subtotal</span>
                                        <span className={`font-bold ${theme.text}`}>රු {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {sessionUser ? (
                                        <form onSubmit={handleCheckout} className="space-y-4">
                                            <button
                                                type="submit"
                                                disabled={isCheckingOut}
                                                className={`w-full py-4 rounded-xl ${theme.buttonBg} font-bold shadow-lg flex justify-center items-center gap-2`}
                                            >
                                                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Checkout'}
                                            </button>
                                            <p className={`text-xs text-center ${theme.textMuted}`}>By checking out, you agree to {shopName}&apos;s Terms of Service.</p>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'} text-sm`}>
                                                <p className="font-bold mb-0.5">Authentication Required</p>
                                                <p className="opacity-90 leading-tight">Please connect your account to securely place this order and track its status.</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    alert('Please log in to continue to checkout.');
                                                    setIsCartOpen(false);
                                                    router.push(`/shop/${routePath}/login?next=${encodeURIComponent(`/shop/${routePath}/checkout`)}`);
                                                }}
                                                className={`w-full py-4 rounded-xl ${theme.buttonBg} font-bold shadow-lg flex justify-center items-center gap-2`}
                                            >
                                                Sign In to Continue
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {productPicker && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border ${theme.cartPanel}`}>
                        <div className="flex justify-between items-start gap-3 mb-4">
                            <div>
                                <h3 className={`text-lg font-bold ${theme.text}`}>{productPicker.product.title}</h3>
                                <p className={`text-xs ${theme.textMuted}`}>{formatPriceWithUnit(productPicker.product.price, productPicker.product.selling_unit, productPicker.product.selling_unit_value)}</p>
                            </div>
                            <button onClick={() => setProductPicker(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="mb-4">
                            <p className={`text-sm ${theme.textMuted} mb-2`}>Choose quantity</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setProductPicker(prev => prev ? { ...prev, quantityMultiplier: Math.max(1, prev.quantityMultiplier - 1) } : prev)}
                                    className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    value={productPicker.quantityMultiplier}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setProductPicker(prev => prev ? { ...prev, quantityMultiplier: Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1 } : prev);
                                    }}
                                    className="w-20 text-center px-2 py-2 rounded-lg border border-gray-300 text-sm"
                                />
                                <button
                                    onClick={() => setProductPicker(prev => prev ? { ...prev, quantityMultiplier: prev.quantityMultiplier + 1 } : prev)}
                                    className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const selectedQty = normalizeUnitValue(productPicker.product.selling_unit_value) * productPicker.quantityMultiplier;
                            const selectedSubtotal = productPicker.product.price * productPicker.quantityMultiplier;
                            const maxMultiplier = getMaxMultiplier(productPicker.product);
                            const exceeds = productPicker.quantityMultiplier > maxMultiplier;
                            return (
                                <>
                                    <p className={`text-sm ${theme.textMuted} mb-1`}>You are adding: <span className={`font-semibold ${theme.text}`}>{formatQuantityLabel(selectedQty, productPicker.product.selling_unit)}</span></p>
                                    <p className={`text-sm ${theme.textMuted} mb-3`}>Subtotal: <span className={`font-semibold ${theme.text}`}>Rs. {selectedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
                                    {exceeds && (
                                        <p className="text-xs text-red-500 mb-3">Only {formatQuantityLabel(productPicker.product.stock_quantity, productPicker.product.stock_unit)} left in stock.</p>
                                    )}
                                </>
                            );
                        })()}

                        <button
                            onClick={addSelectedToCart}
                            disabled={productPicker.quantityMultiplier > getMaxMultiplier(productPicker.product)}
                            className={`w-full py-2.5 rounded-lg font-semibold ${theme.buttonBg} disabled:opacity-50`}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

