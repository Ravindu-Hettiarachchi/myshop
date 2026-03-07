'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock Product Type
interface Product {
    id: string;
    title: string;
    price: number;
    stock_quantity: number;
    image: string;
    description: string;
}

export default function StorefrontLayout({ routePath }: { routePath: string }) {
    // 1. Simulating a fetch of the shop's config from Supabase via `routePath`
    // const { data: shop } = await supabase.from('shops').select('*').eq('route_path', routePath).single();

    // Hardcoded mock configuration logic for demonstration
    const isDarkTheme = routePath === 'lanka-batiks'; // 'modern-dark' based on schema seed
    const shopName = routePath === 'lanka-batiks' ? 'Lanka Batiks' : 'Ceylon Spice House';

    const [products, setProducts] = useState<Product[]>([]);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        // Simulating product fetch for the specific shop (Module 3)
        // const { data: products } = await supabase.from('products').select('*').eq('shop_id', shop.id)
        if (routePath === 'ceylon-spices') {
            setProducts([
                { id: '1', title: 'Premium Cinnamon Sticks', price: 1500.0, stock_quantity: 50, image: 'https://images.unsplash.com/photo-1608688461751-692348db49b5?q=80&w=400&h=400&auto=format&fit=crop', description: 'Pure Ceylon Cinnamon from Galle.' },
                { id: '2', title: 'Roasted Curry Powder', price: 800.0, stock_quantity: 3, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&h=400&auto=format&fit=crop', description: 'Traditional recipe for spicy curries.' },
                { id: '4', title: 'Organic Cloves', price: 1200.0, stock_quantity: 120, image: 'https://images.unsplash.com/photo-1621217646535-420224ce3d2f?q=80&w=400&h=400&auto=format&fit=crop', description: 'Hand-picked organic whole cloves.' }
            ]);
        } else if (routePath === 'lanka-batiks') {
            setProducts([
                { id: '3', title: 'Traditional Handloom Saree', price: 12000.0, stock_quantity: 15, image: 'https://images.unsplash.com/photo-1610030469983-98e550d615ef?q=80&w=400&h=400&auto=format&fit=crop', description: 'Beautifully crafted handloom saree.' },
                { id: '5', title: 'Batik Sarong', price: 3500.0, stock_quantity: 40, image: 'https://images.unsplash.com/photo-1528659556827-88a3a0e1b1ae?q=80&w=400&h=400&auto=format&fit=crop', description: 'Comfortable cotton batik sarong.' }
            ]);
        }
    }, [routePath]);

    const addToCart = () => setCartCount(prev => prev + 1);

    // Theme configuration mappings
    const theme = {
        bg: isDarkTheme ? 'bg-gray-950' : 'bg-gray-50',
        text: isDarkTheme ? 'text-gray-100' : 'text-gray-900',
        textMuted: isDarkTheme ? 'text-gray-400' : 'text-gray-600',
        cardBg: isDarkTheme ? 'bg-gray-900' : 'bg-white',
        cardBorder: isDarkTheme ? 'border-gray-800' : 'border-gray-100',
        buttonBg: isDarkTheme ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
        headerBg: isDarkTheme ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-100',
        iconBg: isDarkTheme ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black',
    };

    return (
        <div className={`min-h-screen ${theme.bg} font-sans transition-colors duration-500`}>
            {/* Storefront Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${theme.headerBg} transition-colors duration-500`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Branding */}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${theme.iconBg} rounded-xl flex items-center justify-center`}>
                                <span className="font-bold text-xl">{shopName.charAt(0)}</span>
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
                                <button className={`relative p-2 ${theme.textMuted} hover:${theme.text} transition rounded-full hover:bg-opacity-10 hover:bg-black`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
                    <h2 className={`text-4xl sm:text-5xl font-extrabold ${theme.text} tracking-tight mb-6`}>
                        Welcome to {shopName}
                    </h2>
                    <p className={`text-xl ${theme.textMuted} leading-relaxed mb-8`}>
                        Browse our latest collection. This storefront is physically generated and completely isolated, providing exceptional performance and security.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm font-mono opacity-60">
                        <span className={`${theme.textMuted} px-3 py-1 rounded-full border ${theme.cardBorder}`}>
                            Route: /shop/{routePath}
                        </span>
                        <span className={`${theme.textMuted} px-3 py-1 rounded-full border ${theme.cardBorder}`}>
                            Theme: {isDarkTheme ? 'modern-dark' : 'classic-light'}
                        </span>
                    </div>
                </div>
            </section>

            {/* Main Product Grid (Module 3 Integration) */}
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                {product.stock_quantity <= 5 && (
                                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        Only {product.stock_quantity} Left
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
                                        onClick={addToCart}
                                        disabled={product.stock_quantity === 0}
                                        className={`${theme.buttonBg} px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className={`py-12 border-t mt-12 ${theme.cardBorder} ${theme.cardBg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className={`${theme.textMuted} text-sm`}>
                        © {new Date().getFullYear()} {shopName}. Powered by MyShop Enterprise engine.
                    </p>
                    <div className="flex gap-4">
                        <Link href="#" className={`${theme.textMuted} hover:${theme.text} text-sm`}>Terms</Link>
                        <Link href="#" className={`${theme.textMuted} hover:${theme.text} text-sm`}>Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
