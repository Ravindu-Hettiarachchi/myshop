import React from 'react';
import { PackageOpen, ShoppingBag } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    image_urls: string[] | null;
}

interface ShopConfig {
    shop_name: string;
    tagline: string | null;
    primary_color: string;
    font: string;
    banner_url: string | null;
    logo_url: string | null;
    announcement_bar: string | null;
    footer_text: string | null;
}

interface Props {
    shop: ShopConfig;
    products: Product[];
}

export default function ModernDark({ shop, products }: Props) {
    const primaryColor = shop.primary_color || '#6366F1';

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-gray-950 text-white">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-sm py-2 px-4 font-medium">
                    {shop.announcement_bar}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name} className="h-10 w-auto object-contain" />
                        ) : (
                            <div style={{ backgroundColor: primaryColor }} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                {shop.shop_name[0]}
                            </div>
                        )}
                        <span className="text-xl font-bold tracking-tight">{shop.shop_name}</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                        <a href="#products" className="hover:text-white transition-colors">Products</a>
                        <a href="#" className="hover:text-white transition-colors">About</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </nav>
                    <button style={{ backgroundColor: primaryColor }} className="text-white text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                        Cart (0)
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative py-32 overflow-hidden">
                {/* Glow effect */}
                <div style={{ backgroundColor: primaryColor }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl" />
                {shop.banner_url && (
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                    <div style={{ color: primaryColor }} className="text-sm font-medium mb-4 uppercase tracking-widest">Welcome to</div>
                    <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {shop.shop_name}
                    </h1>
                    {shop.tagline && <p className="text-xl text-gray-400 mb-10">{shop.tagline}</p>}
                    <a href="#products" style={{ backgroundColor: primaryColor }} className="inline-block text-white px-10 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-lg shadow-lg">
                        Explore Collection
                    </a>
                </div>
            </section>

            {/* Products Grid */}
            <section id="products" className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold mb-12 text-center">
                    <span style={{ color: primaryColor }}>Our</span> Collection
                </h2>
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-600 flex flex-col items-center">
                        <PackageOpen className="w-16 h-16 mb-4 text-gray-700" strokeWidth={1} />
                        <p className="text-xl">No products yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all duration-300">
                                <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-gray-700 opacity-50" strokeWidth={1} />
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-white mb-1">{product.title}</h3>
                                    {product.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>}
                                    <div className="flex items-center justify-between mt-3">
                                        <span style={{ color: primaryColor }} className="text-xl font-bold">
                                            Rs. {product.price.toLocaleString()}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.stock_quantity > 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                            {product.stock_quantity > 0 ? 'In Stock' : 'Sold Out'}
                                        </span>
                                    </div>
                                    <button
                                        disabled={product.stock_quantity === 0}
                                        style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                        className={`mt-4 w-full py-3 rounded-xl text-sm font-bold transition-all ${product.stock_quantity > 0 ? 'text-white hover:opacity-90' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                    >
                                        {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-10 text-center text-sm text-gray-600">
                <div className="flex justify-center mb-4">
                    {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.shop_name} className="h-12 w-auto object-contain grayscale opacity-50 hover:opacity-100 transition-opacity" />
                    ) : (
                        <p className="font-bold text-gray-400">{shop.shop_name}</p>
                    )}
                </div>
                <p>{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                <p className="mt-3 text-xs">Powered by <span style={{ color: primaryColor }} className="font-semibold">MyShop</span></p>
            </footer>
        </div>
    );
}
