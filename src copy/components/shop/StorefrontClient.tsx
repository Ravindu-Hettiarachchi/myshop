'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getThemeComponent, isThemeDark } from '@/lib/themes';
import DynamicTheme, { type DynamicThemeConfig } from '@/components/storefronts/DynamicTheme';

interface Product {
    id: string;
    title: string;
    price: number;
    stock_quantity: number;
    image: string;
    description: string;
}

interface CartItem extends Product {
    cartQuantity: number;
    image_urls?: string[]; // to match the backend layout if needed
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
    productList: any[];
    sessionUserInit: any;
    themeConfig?: ThemeConfigRow | null;
}

export default function StorefrontClient({ routePath, shopConfig, productList, sessionUserInit, themeConfig }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [sessionUser, setSessionUser] = useState<any>(sessionUserInit);

    // Initial mapping of products from backend format to Cart format
    const products: Product[] = productList.map(p => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        stock_quantity: p.stock_quantity,
        description: p.description || '',
        image: p.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80',
        ...p
    }));

    useEffect(() => {
        const fetchStoreData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSessionUser(session.user);
                setCustomerEmail(session.user.email || '');
            }
        };
        fetchStoreData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.stock_quantity) return prev; // Cannot exceed stock
                return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
            }
            return [...prev, {
                ...product,
                image: product.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80',
                cartQuantity: 1
            }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Force a strict real-time session check
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            alert('You must be logged in to securely place an order. Redirecting you to login...');
            router.push(`/shop/${routePath}/login`);
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
                    products={productList as any}
                    onAddToCart={addToCart}
                    onOpenCart={() => setIsCartOpen(true)}
                    cartCount={cartCount}
                    sessionUser={sessionUser}
                    themeConfig={dynamicCfg}
                />
            );
        }

        // Coded theme: use the registry component
        const ThemeComponent = getThemeComponent(shopConfig.template);
        return (
            <ThemeComponent
                shop={enrichedConfig}
                products={productList as any}
                onAddToCart={addToCart}
                onOpenCart={() => setIsCartOpen(true)}
                cartCount={cartCount}
                sessionUser={sessionUser}
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
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className={`font-bold ${theme.text} line-clamp-2`}>{item.title}</h4>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className={`${theme.textMuted} text-sm mt-1`}>Qty: {item.cartQuantity}</p>
                                                <p className={`font-bold ${theme.text} mt-2`}>රු {(item.price * item.cartQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
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
                                            <p className={`text-xs text-center ${theme.textMuted}`}>By checking out, you agree to {shopName}'s Terms of Service.</p>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded-xl ${isDarkTheme ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : 'bg-amber-50 border border-amber-200 text-amber-800'} text-sm`}>
                                                <p className="font-bold mb-0.5">Authentication Required</p>
                                                <p className="opacity-90 leading-tight">Please connect your account to securely place this order and track its status.</p>
                                            </div>
                                            <button
                                                onClick={() => { setIsCartOpen(false); router.push(`/shop/${routePath}/login`); }}
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
        </div>
    );
}

