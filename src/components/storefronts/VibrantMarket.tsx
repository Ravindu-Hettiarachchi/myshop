import React from 'react';
import { PackageOpen, ShoppingBag, Store, Sparkles, Phone, BookOpen, ShoppingCart } from 'lucide-react';

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

export default function VibrantMarket({ shop, products }: Props) {
    const primaryColor = shop.primary_color || '#F59E0B';

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-amber-50 text-gray-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-sm py-2.5 px-4 font-bold flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> {shop.announcement_bar} <Sparkles className="w-4 h-4" />
                </div>
            )}

            {/* Navigation */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name} className="h-12 w-auto object-contain" />
                        ) : (
                            <div style={{ backgroundColor: primaryColor }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl rotate-3">
                                {shop.shop_name[0]}
                            </div>
                        )}
                        <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>{shop.shop_name}</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
                        <a href="#products" className="hover:text-gray-900 transition-colors flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" /> Products</a>
                        <a href="#" className="hover:text-gray-900 transition-colors flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Our Story</a>
                        <a href="#" className="hover:text-gray-900 transition-colors flex items-center gap-1.5"><Phone className="w-4 h-4" /> Contact</a>
                    </nav>
                    <button style={{ backgroundColor: primaryColor }} className="text-white text-sm px-5 py-2.5 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Cart (0)
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section
                className="relative py-24 text-center"
                style={{
                    background: shop.banner_url
                        ? `url(${shop.banner_url}) center/cover`
                        : `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}05 100%)`
                }}
            >
                {shop.banner_url && <div className="absolute inset-0 bg-white/70" />}
                <div className="relative z-10 max-w-2xl mx-auto px-6">
                    <div className="inline-block bg-white rounded-3xl shadow-xl px-10 py-10 flex flex-col items-center">
                        <Store className="w-12 h-12 text-amber-500 mb-4" />
                        <h1 className="text-4xl font-extrabold mb-3" style={{ color: primaryColor }}>{shop.shop_name}</h1>
                        {shop.tagline && <p className="text-gray-600 text-lg mb-6">{shop.tagline}</p>}
                        <a href="#products" style={{ backgroundColor: primaryColor }} className="inline-block text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity text-lg shadow-lg">
                            Browse Now →
                        </a>
                    </div>
                </div>
            </section>

            {/* Products */}
            <section id="products" className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-extrabold flex items-center gap-2">Fresh Picks <Sparkles className="w-6 h-6 text-amber-500" /></h2>
                    <span className="text-sm text-gray-500">{products.length} items available</span>
                </div>
                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-3xl flex flex-col items-center">
                        <PackageOpen className="w-16 h-16 mb-4 text-gray-300" strokeWidth={1} />
                        <p className="text-xl font-semibold">No products yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <ShoppingBag className="w-16 h-16 text-gray-200" strokeWidth={1} />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{product.title}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span style={{ color: primaryColor }} className="font-extrabold text-lg">
                                            Rs.{product.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <button
                                        disabled={product.stock_quantity === 0}
                                        style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                        className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all ${product.stock_quantity > 0 ? 'text-white hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        {product.stock_quantity > 0 ? '+ Add to Cart' : 'Sold Out'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{ backgroundColor: primaryColor }} className="py-10 text-center text-white flex flex-col items-center">
                {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.shop_name} className="h-16 w-auto object-contain mb-4 filter drop-shadow-md bg-white p-2 rounded-xl" />
                ) : (
                    <p className="text-2xl font-extrabold mb-1 flex items-center gap-2 justify-center">{shop.shop_name} <Store className="w-6 h-6" /></p>
                )}
                <p className="opacity-80 text-sm mt-2">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                <p className="mt-3 text-xs opacity-60">Powered by MyShop</p>
            </footer>
        </div>
    );
}
