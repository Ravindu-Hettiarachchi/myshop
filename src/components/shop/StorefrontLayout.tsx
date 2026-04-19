'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Product {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number | null;
    stock_quantity: number;
    image: string;
    description: string;
}

interface CartItem extends Product {
    cartQuantity: number;
}

export default function StorefrontLayout({ routePath }: { routePath: string }) {
    const router = useRouter();
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shopData, setShopData] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessionUser, setSessionUser] = useState<any>(null);

    useEffect(() => {
        const fetchStoreData = async () => {
            // 0. Fetch Customer Session State
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSessionUser(session.user);
                setCustomerEmail(session.user.email || '');
            }

            // 1. Fetch real shop data
            const { data: dbShop } = await supabase.from('shops').select('*').eq('route_path', routePath).single();
            if (dbShop) {
                setShopData(dbShop);
                // 2. Fetch real products for this shop
                const { data: dbProducts } = await supabase.from('products').select('*').eq('shop_id', dbShop.id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (dbProducts) setProducts(dbProducts.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    price: Number(p.price),
                    stock_quantity: p.stock_quantity,
                    description: p.description || '',
                    image: p.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80'
                })));
            } else {
                // Fallback for mocked routes if they don't exist in DB yet
                setShopData({
                    id: 'mock-id',
                    shop_name: routePath === 'lanka-batiks' ? 'Lanka Batiks' : 'Ceylon Spice House',
                    template: routePath === 'lanka-batiks' ? 'modern-dark' : 'minimal-white'
                });

                if (routePath === 'ceylon-spices') {
                    setProducts([
                        { id: '1', title: 'Premium Cinnamon Sticks', price: 1500.0, stock_quantity: 50, image: 'https://images.unsplash.com/photo-1608688461751-692348db49b5?q=80&w=400&h=400&auto=format&fit=crop', description: 'Pure Ceylon Cinnamon from Galle.' },
                        { id: '2', title: 'Roasted Curry Powder', price: 800.0, stock_quantity: 3, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&h=400&auto=format&fit=crop', description: 'Traditional recipe for spicy curries.' }
                    ]);
                } else if (routePath === 'lanka-batiks') {
                    setProducts([
                        { id: '3', title: 'Traditional Handloom Saree', price: 12000.0, stock_quantity: 15, image: 'https://images.unsplash.com/photo-1610030469983-98e550d615ef?q=80&w=400&h=400&auto=format&fit=crop', description: 'Beautifully crafted handloom saree.' }
                    ]);
                }
            }
        };
        fetchStoreData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routePath]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.stock_quantity) return prev; // Cannot exceed stock
                return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
            }
            return [...prev, { ...product, cartQuantity: 1 }];
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

        if (!sessionUser) {
            alert('You must be logged in to securely place an order. Redirecting you to login...');
            router.push(`/shop/${routePath}/login`);
            return;
        }

        if (!shopData || shopData.id === 'mock-id' || cart.length === 0 || !customerEmail) return;

        setIsCheckingOut(true);

        try {
            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    shop_id: shopData.id,
                    customer_email: customerEmail,
                    total_amount: cartTotal,
                    status: 'processing'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Order Items
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.cartQuantity,
                unit_price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            // 3. Optional: Deduct stock amounts (simplified for this demo)

            // 4. Redirect to Tracker
            setIsCartOpen(false);
            setCart([]);
            router.push(`/shop/${routePath}/order/${orderData.id}`);

        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Checkout failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (!shopData) return <div className="min-h-screen flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

    const isDarkTheme = shopData.template === 'modern-dark';
    const shopName = shopData.shop_name;

    const theme = {
        bg: isDarkTheme ? 'bg-gray-950' : 'bg-gray-50',
        text: isDarkTheme ? 'text-gray-100' : 'text-gray-900',
        textMuted: isDarkTheme ? 'text-gray-400' : 'text-gray-600',
        cardBg: isDarkTheme ? 'bg-gray-900' : 'bg-white',
        cardBorder: isDarkTheme ? 'border-gray-800' : 'border-gray-100',
        buttonBg: isDarkTheme ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
        headerBg: isDarkTheme ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-100',
        iconBg: isDarkTheme ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black',
        cartOverlay: isDarkTheme ? 'bg-black/60' : 'bg-gray-900/30',
        cartPanel: isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    };

    return (
        <div className={`min-h-screen ${theme.bg} font-sans transition-colors duration-500 relative`}>
            {/* Storefront Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${theme.headerBg} transition-colors duration-500`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Branding */}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center overflow-hidden`}>
                                {shopData.logo_url ? (
                                    <img src={shopData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-xl">{shopName.charAt(0)}</span>
                                )}
                            </div>
                            <h1 className={`text-2xl font-extrabold tracking-tight ${theme.text}`}>
                                {shopName}
                            </h1>
                        </div>

                        {/* Navigation / Cart */}
                        <div className="flex items-center gap-6">
                            <nav className="hidden md:flex gap-6">
                                <Link href="#" className={`${theme.textMuted} hover:${theme.text} font-medium transition`}>Shop All</Link>
                                <Link href="#" className={`${theme.textMuted} hover:${theme.text} font-medium transition`}>About Us</Link>
                            </nav>

                            <div className="flex items-center gap-4 border-l pl-6 border-opacity-20 border-gray-500">

                                {/* Customer Auth Tracker */}
                                {sessionUser ? (
                                    <div className={`text-sm font-medium flex items-center gap-2 ${theme.text}`}>
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                            {sessionUser.email?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                ) : (
                                    <Link href={`/shop/${routePath}/login`} className={`text-sm font-medium ${theme.textMuted} hover:${theme.text} transition`}>
                                        Sign In
                                    </Link>
                                )}

                                <button onClick={() => setIsCartOpen(true)} className={`relative p-2 ${theme.textMuted} hover:${theme.text} transition rounded-full hover:bg-opacity-10 hover:bg-black`}>
                                    <ShoppingCart className="w-6 h-6" />
                                    {cartCount > 0 && (
                                        <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                                {/* Admin Portal Link (Debug) */}
                                <Link href="/dashboard" className="hidden sm:flex text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                    Owner Dashboard →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Storefront Hero */}
            <section className={`relative py-16 sm:py-24 ${theme.cardBg} border-b ${theme.cardBorder}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl relative z-10">
                    <h2 className={`text-4xl sm:text-5xl font-extrabold ${theme.text} tracking-tight mb-6`}>
                        Welcome to {shopName}
                    </h2>
                    <p className={`text-xl ${theme.textMuted} leading-relaxed mb-8`}>
                        {shopData.tagline || 'Browse our latest collection. This storefront is physically generated and completely isolated, providing exceptional performance and security.'}
                    </p>
                </div>
                {/* Optional Banner Underlay */}
                {shopData.banner_url && (
                    <div className="absolute inset-0 z-0 opacity-10">
                        <img src={shopData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                )}
            </section>

            {/* Main Product Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-end mb-8">
                    <h3 className={`text-2xl font-bold ${theme.text}`}>Featured Products</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${theme.textMuted}`}>Sort by</span>
                        <select className={`text-sm ${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-md px-2 py-1 outline-none`}>
                            <option>Recommended</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map(product => (
                        <div key={product.id} className={`group flex flex-col ${theme.cardBg} border ${theme.cardBorder} rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300`}>
                            {/* Product Image */}
                            <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        Only {product.stock_quantity} Left
                                    </div>
                                )}
                                {product.stock_quantity === 0 && (
                                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="p-5 flex flex-col flex-1">
                                <h4 className={`text-lg font-bold ${theme.text} mb-1 line-clamp-1`}>{product.title}</h4>
                                <p className={`text-sm ${theme.textMuted} mb-4 line-clamp-2 leading-relaxed flex-1`}>{product.description}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`text-xl font-bold ${theme.text}`}>
                                        රු {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>

                                    <button
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock_quantity === 0}
                                        className={`${theme.buttonBg} px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className={`col-span-full py-20 text-center ${theme.textMuted}`}>
                            No products available in this shop yet.
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className={`py-12 border-t mt-12 ${theme.cardBorder} ${theme.cardBg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className={`${theme.textMuted} text-sm`}>
                        {shopData.footer_text || `© ${new Date().getFullYear()} ${shopName}. Powered by MyShop Enterprise engine.`}
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className={`${theme.textMuted} hover:${theme.text} text-sm`}>Terms</Link>
                        <Link href="#" className={`${theme.textMuted} hover:${theme.text} text-sm`}>Privacy</Link>
                    </div>
                </div>
            </footer>

            {/* Cart Slide-Over Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className={`absolute inset-0 ${theme.cartOverlay} backdrop-blur-sm transition-opacity`} onClick={() => setIsCartOpen(false)}></div>
                    <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
                        <div className={`w-full h-full flex flex-col ${theme.cartPanel} shadow-2xl border-l transform transition-transform`}>

                            {/* Cart Header */}
                            <div className={`flex items-center justify-between p-6 border-b ${theme.cardBorder}`}>
                                <h2 className={`text-xl font-bold ${theme.text}`}>Your Cart ({cartCount})</h2>
                                <button onClick={() => setIsCartOpen(false)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${theme.textMuted}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cart.length === 0 ? (
                                    <div className={`text-center py-12 ${theme.textMuted}`}>
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Your cart is empty.</p>
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

                                    <form onSubmit={handleCheckout} className="space-y-4">
                                        <div>
                                            <label className={`block text-xs font-bold ${theme.textMuted} mb-1 uppercase tracking-wider`}>Email Address for Receipt</label>
                                            <input
                                                type="email"
                                                required
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className={`w-full px-4 py-3 rounded-xl border ${theme.cardBorder} ${theme.cardBg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                            />
                                        </div>
                                        {shopData.id === 'mock-id' ? (
                                            <button disabled type="button" className="w-full py-4 rounded-xl bg-gray-300 text-gray-500 font-bold cursor-not-allowed">
                                                Cannot Checkout Demo Store
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={isCheckingOut}
                                                className={`w-full py-4 rounded-xl ${theme.buttonBg} font-bold shadow-lg flex justify-center items-center gap-2`}
                                            >
                                                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Checkout'}
                                            </button>
                                        )}
                                        <p className={`text-xs text-center ${theme.textMuted}`}>By checking out, you agree to {shopName}&apos;s Terms of Service.</p>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
