'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Loader2, Search, SlidersHorizontal, Check } from 'lucide-react';
import { createCustomerClient } from '@/utils/supabase/customer-client';
import { getThemeComponent, isThemeDark } from '@/lib/themes';
import DynamicTheme, { type DynamicThemeConfig } from '@/components/storefronts/DynamicTheme';
import { formatPriceWithUnit, formatQuantityLabel, normalizeSellingUnit, normalizeStockUnit, normalizeUnitValue, type ProductUnit } from '@/lib/products';
import type { User } from '@supabase/supabase-js';

export interface StorefrontVariant {
    id: string;
    options: Record<string, string>;
    price_override?: number | null;
    compare_at_price?: number | null;
    stock_quantity: number;
    image_url?: string | null;
    sku?: string | null;
}

interface Product {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number | null;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    stock_unit: ProductUnit;
    image?: string;
    description: string;
    image_urls?: string[];
    has_variants?: boolean;
    variation_options?: { name: string; values: string[] }[] | null;
    product_variants?: StorefrontVariant[];
}

interface CartItem extends Product {
    quantityMultiplier: number;
    orderedQuantity: number;
    orderedUnit: ProductUnit;
    variant_id?: string;
    variant_title?: string;
}

interface StorefrontProduct {
    id: string;
    title: string;
    description: string | null;
    price: number | string;
    compare_at_price?: number | null;
    selling_unit_value: number | string | null;
    selling_unit: string | null;
    stock_quantity: number;
    stock_unit: string | null;
    unit_value?: number | string | null;
    unit?: string | null;
    image_urls?: string[] | null;
    has_variants?: boolean;
    variation_options?: { name: string; values: string[] }[] | null;
    product_variants?: StorefrontVariant[];
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
    const supabase = createCustomerClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [sessionUser, setSessionUser] = useState<User | null>(sessionUserInit);
    const [isStorefrontCustomer, setIsStorefrontCustomer] = useState(false);
    const [productPicker, setProductPicker] = useState<{ 
        product: Product; 
        quantityMultiplier: number; 
        selectedOptions: Record<string, string>;
        explicitImage?: string | null;
    } | null>(null);

    // Global Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onlySaleItems, setOnlySaleItems] = useState(false);

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
        compare_at_price: p.compare_at_price != null ? Number(p.compare_at_price) : undefined,
        has_variants: p.has_variants,
        variation_options: p.variation_options,
        product_variants: p.product_variants,
    }));

    // Active Filtered Products
    const activeProducts = React.useMemo(() => {
        return products.filter(p => {
            if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (onlySaleItems) {
                const hasSale = p.compare_at_price != null && p.compare_at_price > p.price;
                const hasVariantSale = p.has_variants && p.product_variants?.some(v => v.compare_at_price != null && v.compare_at_price > (v.price_override || p.price));
                if (!hasSale && !hasVariantSale) return false;
            }
            if (minPrice && p.price < Number(minPrice)) return false;
            if (maxPrice && p.price > Number(maxPrice)) return false;
            return true;
        });
    }, [products, searchQuery, minPrice, maxPrice, onlySaleItems]);

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
            const user = session?.user ?? null;
            setSessionUser(user);

            if (!user) {
                setIsStorefrontCustomer(false);
                return;
            }

            const { data: customerLink } = await supabase
                .from('shop_customers')
                .select('id')
                .eq('shop_id', shopConfig.id)
                .eq('auth_user_id', user.id)
                .maybeSingle<{ id: string }>();

            setIsStorefrontCustomer(Boolean(customerLink?.id));
        };
        fetchStoreData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shopConfig.id]);

    const openProductPicker = (productInput: unknown) => {
        if (!isCartProduct(productInput)) return;
        const product = productInput as Product;
        const initialOptions: Record<string, string> = {};
        if (product.has_variants && product.variation_options && product.product_variants?.length) {
            const firstVariant = product.product_variants[0];
            Object.assign(initialOptions, firstVariant.options);
        }
        setProductPicker({ product, quantityMultiplier: 1, selectedOptions: initialOptions });
    };

    const getActiveVariant = (product: Product, options: Record<string, string>) => {
        if (!product.has_variants || !product.product_variants) return null;
        return product.product_variants.find(v => 
            Object.entries(options).every(([k, val]) => v.options[k] === val)
        ) || null;
    };

    const getMaxMultiplier = (product: Product, specificVariant?: StorefrontVariant | null) => {
        const perPack = normalizeUnitValue(product.selling_unit_value);
        if (perPack <= 0) return 0;
        const stockToCheck = specificVariant ? specificVariant.stock_quantity : product.stock_quantity;
        return Math.max(0, Math.floor(stockToCheck / perPack));
    };

    const addSelectedToCart = () => {
        if (!productPicker) return;
        const { product, quantityMultiplier, selectedOptions } = productPicker;
        
        const activeVariant = product.has_variants ? getActiveVariant(product, selectedOptions) : null;
        if (product.has_variants && !activeVariant) {
            alert('This variant combination is unavailable.');
            return;
        }

        const maxMultiplier = getMaxMultiplier(product, activeVariant);
        if (maxMultiplier <= 0) return;
        const safeMultiplier = Math.min(maxMultiplier, Math.max(1, quantityMultiplier));
        const requestedQuantity = normalizeUnitValue(product.selling_unit_value) * safeMultiplier;

        const cartItemId = activeVariant ? `${product.id}-${activeVariant.id}` : product.id;
        const finalPrice = activeVariant?.price_override ?? product.price;

        setCart(prev => {
            const existing = prev.find(item => item.id === cartItemId || (item.id === product.id && item.variant_id === activeVariant?.id));
            if (existing) {
                const newMultiplier = existing.quantityMultiplier + safeMultiplier;
                const cappedMultiplier = Math.min(newMultiplier, maxMultiplier);
                return prev.map(item => item.id === existing.id
                    ? {
                        ...item,
                        quantityMultiplier: cappedMultiplier,
                        orderedQuantity: normalizeUnitValue(item.selling_unit_value) * cappedMultiplier,
                    }
                    : item);
            }
            return [...prev, {
                ...product,
                id: cartItemId,
                price: finalPrice,
                image: activeVariant?.image_url || product.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80',
                quantityMultiplier: safeMultiplier,
                orderedQuantity: requestedQuantity,
                orderedUnit: product.selling_unit,
                variant_id: activeVariant?.id,
                variant_title: activeVariant ? Object.values(activeVariant.options).join(' / ') : undefined,
            }];
        });
        setProductPicker(null);
        setIsCartOpen(true);
    };

    const updateItemMultiplier = (cartItemRowId: string, nextMultiplier: number) => {
        setCart(prev => prev.flatMap(item => {
            if (item.id !== cartItemRowId) return [item];
            const originalProduct = products.find(p => p.id === (item.id.split('-')[0]) || p.id === item.id) || item;
            const originalVariant = item.variant_id && originalProduct.product_variants ? originalProduct.product_variants.find(v => v.id === item.variant_id) : undefined;
            
            const maxMultiplier = getMaxMultiplier(originalProduct, originalVariant);
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

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            alert('You must be logged in to securely place an order. Redirecting you to login...');
            router.push(`/shop/${routePath}/login?next=${encodeURIComponent(`/shop/${routePath}/checkout`)}`);
            return;
        }

        if (!isStorefrontCustomer) {
            alert('This account is not linked as a customer for this shop.');
            router.push(`/shop/${routePath}`);
            return;
        }

        if (!shopConfig || cart.length === 0) return;

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
        setIsStorefrontCustomer(false);
        router.push(`/shop/${routePath}`);
        router.refresh();
    };

    const customerDisplayName = sessionUser?.user_metadata?.full_name || sessionUser?.email?.split('@')[0] || 'Account';
    const customerSessionUser = isStorefrontCustomer ? sessionUser : null;

    const renderTemplate = () => {
        const enrichedConfig = { ...shopConfig, route_path: routePath };

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
                    products={activeProducts}
                    onAddToCart={openProductPicker}
                    onOpenCart={() => setIsCartOpen(true)}
                    cartCount={cartCount}
                    sessionUser={customerSessionUser}
                    customerDisplayName={customerDisplayName}
                    onLogout={handleLogout}
                    themeConfig={dynamicCfg}
                />
            );
        }

        const ThemeComponent = getThemeComponent(shopConfig.template);
        return (
            <ThemeComponent
                shop={enrichedConfig}
                products={activeProducts}
                onAddToCart={openProductPicker}
                onOpenCart={() => setIsCartOpen(true)}
                cartCount={cartCount}
                sessionUser={customerSessionUser}
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
            {renderTemplate()}

            {!isCartOpen && !productPicker && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md font-bold text-sm tracking-wide transition-all hover:scale-105 active:scale-95 ${isDarkTheme ? 'bg-white/90 text-black border border-white/20' : 'bg-black/90 text-white border border-black/10'}`}
                    >
                        <Search className="w-4 h-4" />
                        Search & Filter
                        {(searchQuery || minPrice || maxPrice || onlySaleItems) && (
                            <span className={`w-2 h-2 rounded-full absolute top-0 right-0 transform translate-x-1 -translate-y-1 ${isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'}`} />
                        )}
                    </button>
                </div>
            )}

            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className={`absolute inset-0 ${theme.cartOverlay} backdrop-blur-[2px] transition-opacity`} onClick={() => setIsCartOpen(false)}></div>
                    <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
                        <div className={`w-full h-full flex flex-col ${theme.cartPanel} shadow-2xl border-l transform transition-transform`}>

                            <div className={`flex items-center justify-between p-6 border-b ${theme.cardBorder}`}>
                                <h2 className={`text-xl font-bold ${theme.text}`}>Your Checkout ({cartCount})</h2>
                                <button onClick={() => setIsCartOpen(false)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme.textMuted}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

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

                            {cart.length > 0 && (
                                <div className={`p-6 border-t ${theme.cardBorder} bg-opacity-50`}>
                                    <div className="flex justify-between mb-4">
                                        <span className={`font-bold ${theme.textMuted}`}>Subtotal</span>
                                        <span className={`font-bold ${theme.text}`}>රු {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {customerSessionUser ? (
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
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border ${theme.cartPanel} overflow-hidden flex flex-col md:flex-row relative animate-scale-in`}>
                        <button onClick={() => setProductPicker(null)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white backdrop-blur rounded-full text-gray-800 shadow-sm transition">
                            <X className="w-5 h-5" />
                        </button>
                        
                        {(() => {
                            const activeVariant = productPicker.product.has_variants ? getActiveVariant(productPicker.product, productPicker.selectedOptions) : null;
                            const variantImage = activeVariant?.image_url;
                            const displayImage = productPicker.explicitImage ?? variantImage ?? productPicker.product.image_urls?.[0];
                            const originalPrice = (activeVariant?.compare_at_price != null && activeVariant.compare_at_price > 0) ? activeVariant.compare_at_price : productPicker.product.compare_at_price;
                            const displayPrice = (activeVariant?.price_override != null && activeVariant.price_override > 0) ? activeVariant.price_override : productPicker.product.price;
                            const isSale = originalPrice != null && originalPrice > displayPrice;
                            const maxMultiplier = getMaxMultiplier(productPicker.product, activeVariant);
                            
                            const selectedQty = normalizeUnitValue(productPicker.product.selling_unit_value) * productPicker.quantityMultiplier;
                            const selectedSubtotal = displayPrice * productPicker.quantityMultiplier;
                            const exceeds = productPicker.quantityMultiplier > maxMultiplier;
                            
                            const isUnavailable = productPicker.product.has_variants && !activeVariant;
                            const stockCount = activeVariant ? activeVariant.stock_quantity : productPicker.product.stock_quantity;

                            const renderVariationSelectors = () => {
                                if (!productPicker.product.has_variants || !productPicker.product.variation_options) return null;
                                
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return productPicker.product.variation_options.map((opt: any) => {
                                    const optionName = typeof opt === 'string' ? opt : opt.name;
                                    const uniqueValues = Array.from(new Set(productPicker.product.product_variants?.map(v => v.options[optionName]).filter(Boolean)));
                                    if (uniqueValues.length === 0) return null;

                                    return (
                                        <div key={optionName} className="mb-5">
                                            <p className={`text-sm tracking-wide uppercase font-bold ${theme.text} mb-3`}>{optionName}</p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {uniqueValues.map(val => {
                                                    const isSelected = productPicker.selectedOptions[optionName] === val;
                                                    return (
                                                        <button
                                                            key={val as string}
                                                            onClick={() => setProductPicker(prev => prev ? { ...prev, selectedOptions: { ...prev.selectedOptions, [optionName]: val as string }, explicitImage: null } : prev)}
                                                            className={`px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                                                        >
                                                            {val as string}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            };

                            return (
                                <>
                                    <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-10 border-b md:border-b-0 md:border-r border-gray-100 space-y-4">
                                        <div className="w-full aspect-square relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200/60">
                                            <img 
                                                src={displayImage || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=600&q=80'} 
                                                alt={productPicker.product.title} 
                                                className="absolute inset-0 w-full h-full object-contain p-4 transition-all duration-300" 
                                            />
                                        </div>
                                        
                                        {!!productPicker.product.image_urls && productPicker.product.image_urls.length > 1 && (
                                            <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-none snap-x p-1">
                                                {productPicker.product.image_urls.map((imgUrl, idx) => {
                                                    const isActive = displayImage === imgUrl;
                                                    return (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setProductPicker(prev => prev ? { ...prev, explicitImage: imgUrl } : prev)}
                                                            className={`w-[72px] h-[72px] flex-shrink-0 snap-start rounded-xl overflow-hidden border-2 transition-all duration-200 ${isActive ? 'border-blue-600 opacity-100 shadow-md ring-2 ring-blue-600/20' : 'border-transparent opacity-60 bg-white hover:opacity-100 hover:border-gray-300'}`}
                                                        >
                                                            <img src={imgUrl} className="w-full h-full object-cover" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-full md:w-1/2 flex flex-col p-6 sm:p-8 max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
                                        <div className="mb-6 flex-shrink-0">
                                            <h2 className={`text-3xl font-black ${theme.text} leading-tight mb-2 pr-8`}>{productPicker.product.title}</h2>
                                            {productPicker.product.description && (
                                                <p className={`text-sm ${theme.textMuted} mb-4 leading-relaxed`}>{productPicker.product.description}</p>
                                            )}
                                            <div className="flex items-end gap-3 pb-4 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <p className={`text-3xl font-semibold tracking-tight ${theme.text}`}>Rs. {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    {isSale && (
                                                        <p className="text-xl font-medium tracking-tight text-red-400 line-through">Rs. {originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${theme.textMuted} mb-1.5`}> / {formatQuantityLabel(normalizeUnitValue(productPicker.product.selling_unit_value), productPicker.product.selling_unit)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1">
                                            {renderVariationSelectors()}
                                            
                                            <div className="mb-6">
                                                <p className={`text-sm tracking-wide uppercase font-bold ${theme.text} mb-3`}>Quantity</p>
                                                <div className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/50 w-max">
                                                    <button
                                                        onClick={() => setProductPicker(prev => prev ? { ...prev, quantityMultiplier: Math.max(1, prev.quantityMultiplier - 1) } : prev)}
                                                        className="w-10 h-10 rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center font-black transition"
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
                                                        className="w-16 bg-transparent text-center px-1 font-bold outline-none"
                                                    />
                                                    <button
                                                        onClick={() => setProductPicker(prev => prev ? { ...prev, quantityMultiplier: prev.quantityMultiplier + 1 } : prev)}
                                                        className="w-10 h-10 rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center font-black transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex-shrink-0">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className={`text-xs uppercase font-bold tracking-wider ${theme.textMuted} mb-1`}>Total for {formatQuantityLabel(selectedQty, productPicker.product.selling_unit)}</p>
                                                    <p className={`text-2xl font-black ${theme.text}`}>Rs. {selectedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="text-right">
                                                    {isUnavailable ? (
                                                        <p className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Unavailable</p>
                                                    ) : maxMultiplier <= 0 ? (
                                                        <p className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Out of Stock</p>
                                                    ) : (
                                                        <p className={`text-sm font-bold ${exceeds ? 'text-red-500 bg-red-50 px-3' : 'text-emerald-700 bg-emerald-50 px-3'} py-1 rounded-full border ${exceeds ? 'border-red-100' : 'border-emerald-100'}`}>
                                                            {stockCount} available
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={addSelectedToCart}
                                                disabled={isUnavailable || maxMultiplier <= 0 || exceeds}
                                                className={`w-full py-4 text-lg rounded-xl font-bold ${theme.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5 transition-all`}
                                            >
                                                {isUnavailable ? 'Variation Customization Unavailable' : maxMultiplier <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
            
            {isFilterOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={() => setIsFilterOpen(false)}></div>
                    <div className={`w-full sm:max-w-md ${theme.cartPanel} shadow-2xl rounded-t-3xl sm:rounded-2xl flex flex-col relative animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 duration-300 max-h-[85vh]`}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.text}`}>
                                <SlidersHorizontal className="w-5 h-5 opacity-70" />
                                Filters & Search
                            </h3>
                            <button onClick={() => setIsFilterOpen(false)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition ${theme.textMuted}`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${theme.textMuted}`}>Search keyword</label>
                                <div className="relative">
                                    <Search className={`w-4 h-4 absolute left-3.5 top-3 ${theme.textMuted}`} />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Find anything..."
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition focus:ring-2 focus:ring-blue-500/50 ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${theme.textMuted}`}>Price Range (Rs.)</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        placeholder="Min" 
                                        value={minPrice}
                                        onChange={e => setMinPrice(e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input 
                                        type="number" 
                                        placeholder="Max" 
                                        value={maxPrice}
                                        onChange={e => setMaxPrice(e.target.value)}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none text-center ${isDarkTheme ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label 
                                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${onlySaleItems ? (isDarkTheme ? 'bg-red-500/20 border-red-500/50' : 'bg-red-50 border-red-200') : (isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200')}`}
                                    onClick={() => setOnlySaleItems(!onlySaleItems)}
                                >
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${theme.text}`}>Sale Items Only</span>
                                        <span className={`text-xs ${theme.textMuted}`}>Show items with active discounts</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center transition border ${onlySaleItems ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300'}`}>
                                        {onlySaleItems && <Check className="w-4 h-4" />}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                            <button 
                                onClick={() => { setSearchQuery(''); setMinPrice(''); setMaxPrice(''); setOnlySaleItems(false); }}
                                className={`px-4 py-3 rounded-xl font-bold text-sm ${isDarkTheme ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                            >
                                Clear
                            </button>
                            <button 
                                onClick={() => setIsFilterOpen(false)}
                                className={`flex-1 py-3 rounded-xl font-bold shadow-md ${theme.buttonBg}`}
                            >
                                Show Results ({activeProducts.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
