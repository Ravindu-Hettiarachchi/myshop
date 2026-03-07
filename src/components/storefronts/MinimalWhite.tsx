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

export default function MinimalWhite({ shop, products }: Props) {
    const primaryColor = shop.primary_color || '#3B82F6';

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-white text-gray-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-sm py-2 px-4 font-medium">
                    {shop.announcement_bar}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name} className="h-10 w-auto object-contain" />
                        ) : (
                            <div style={{ backgroundColor: primaryColor }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {shop.shop_name[0]}
                            </div>
                        )}
                        <span className="text-xl font-semibold tracking-tight">{shop.shop_name}</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
                        <a href="#products" className="hover:text-gray-900 transition-colors">Products</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">About</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
                    </nav>
                    <button style={{ backgroundColor: primaryColor }} className="text-white text-sm px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity">
                        Cart (0)
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section
                className="relative py-28 flex items-center justify-center text-center overflow-hidden bg-gray-50"
                style={shop.banner_url ? { backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {shop.banner_url && <div className="absolute inset-0 bg-white/60" />}
                <div className="relative z-10 max-w-2xl mx-auto px-6">
                    <h1 className="text-5xl font-bold tracking-tight mb-4">{shop.shop_name}</h1>
                    {shop.tagline && <p className="text-xl text-gray-500 mb-8">{shop.tagline}</p>}
                    <a href="#products" style={{ backgroundColor: primaryColor }} className="inline-block text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
                        Shop Now
                    </a>
                </div>
            </section>

            {/* Products Grid */}
            <section id="products" className="max-w-6xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold mb-10 text-center">Our Products</h2>
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <PackageOpen className="w-16 h-16 mb-4 text-gray-300" strokeWidth={1} />
                        <p className="text-xl">No products yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-gray-200" strokeWidth={1} />
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                                    {product.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>}
                                    <div className="flex items-center justify-between mt-3">
                                        <span style={{ color: primaryColor }} className="text-lg font-bold">
                                            Rs. {product.price.toLocaleString()}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.stock_quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                                        </span>
                                    </div>
                                    <button
                                        disabled={product.stock_quantity === 0}
                                        style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${product.stock_quantity > 0 ? 'text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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
            <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
                <p className="mb-1 font-medium text-gray-700">{shop.shop_name}</p>
                <p>{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                <p className="mt-3 text-xs">Powered by <span style={{ color: primaryColor }} className="font-semibold">MyShop</span></p>
            </footer>
        </div>
    );
}
