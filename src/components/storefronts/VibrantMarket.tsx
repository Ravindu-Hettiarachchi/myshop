import React from 'react';
import { PackageOpen, ShoppingBag, ShieldCheck, Truck, Sparkles, Star } from 'lucide-react';
import { formatPriceWithUnit, type ProductUnit } from '@/lib/products';

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    image_urls: string[] | null;
}

interface ShopConfig {
    shop_name: string;
    route_path: string;
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
    onAddToCart?: (product: Product) => void;
    cartCount?: number;
    onOpenCart?: () => void;
    sessionUser?: unknown;
}

export default function VibrantMarket({ shop, products, onAddToCart, cartCount = 0, onOpenCart, sessionUser }: Props) {
    const primaryColor = shop.primary_color || '#F59E0B';
    const featured = products.slice(0, 4);
    const rest = products.slice(4);

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-white text-gray-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-xs py-2.5 px-4 font-bold tracking-wide flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    {shop.announcement_bar}
                    <Sparkles className="w-3.5 h-3.5" />
                </div>
            )}

            {/* Navigation */}
            <header className="border-b-2 border-opacity-10 sticky top-0 z-20 bg-white/97 backdrop-blur-sm shadow-sm" style={{ borderColor: `${primaryColor}30` }}>
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="h-16 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.shop_name} className="h-9 w-auto object-contain" />
                            ) : (
                                <div style={{ backgroundColor: primaryColor }} className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg">
                                    {shop.shop_name[0]}
                                </div>
                            )}
                            <span style={{ color: primaryColor }} className="text-xl font-extrabold tracking-tight">{shop.shop_name}</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-bold">
                            <a href="#products" className="hover:text-gray-900 transition-colors">Shop</a>
                            <a href="#features" className="hover:text-gray-900 transition-colors">About</a>
                        </nav>
                        <div className="flex items-center gap-2">
                            {sessionUser ? (
                                <a href={`/shop/${shop.route_path}/account`} className="hidden sm:flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
                                    My Orders
                                </a>
                            ) : (
                                <a href={`/shop/${shop.route_path}/login`} className="hidden sm:flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
                                    Sign In
                                </a>
                            )}
                            <button
                                onClick={onOpenCart}
                                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                                className="relative text-white text-sm px-4 py-2 rounded-2xl font-extrabold hover:opacity-90 transition flex items-center gap-2 shadow-lg"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span className="hidden sm:inline">Cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: shop.banner_url
                        ? `url(${shop.banner_url}) center/cover`
                        : `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}08 60%, white 100%)`
                }}
            >
                {shop.banner_url && <div className="absolute inset-0 bg-white/80" />}
                <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-24 md:py-36">
                    <div className="max-w-xl">
                        <div style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }} className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                            <Star className="w-3 h-3 fill-current" />
                            {shop.tagline || 'Best Deals!'}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-none mb-5">
                            Shop Smart,<br />
                            <span style={{ color: primaryColor }}>Live Better.</span>
                        </h1>
                        <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                            Discover amazing deals on premium products, delivered fast across Sri Lanka.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="#products"
                                style={{ backgroundColor: primaryColor }}
                                className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-2xl font-extrabold hover:opacity-90 transition text-sm shadow-xl"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Shop Now
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className="border-y border-gray-100 bg-gray-50">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Truck, label: 'Island-wide Delivery' },
                            { icon: ShieldCheck, label: 'Secure Payments' },
                            { icon: Sparkles, label: 'Top Quality' },
                            { icon: Star, label: 'Best Prices' },
                        ].map(t => (
                            <div key={t.label} className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} strokeWidth={2} />
                                {t.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured */}
            {featured.length > 0 && (
                <section id="products" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p style={{ color: primaryColor }} className="text-xs font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Hot Picks
                            </p>
                            <h2 className="text-2xl font-extrabold text-gray-900">Featured Products</h2>
                        </div>
                        {rest.length > 0 && <a href="#all" style={{ color: primaryColor }} className="text-sm font-extrabold hover:underline">View All →</a>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {featured.map((product) => (
                            <div key={product.id} className="group bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}40`} onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
                                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-10 h-10 text-gray-200" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                                            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Sold Out</span>
                                        </div>
                                    )}
                                    {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">🔥 {product.stock_quantity} left</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="font-extrabold text-gray-900 text-sm truncate mb-0.5">{product.title}</p>
                                    {product.description && <p className="text-xs text-gray-400 line-clamp-1 mb-3">{product.description}</p>}
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-base font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Promo Banner */}
            {rest.length > 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-4">
                    <div className="rounded-3xl overflow-hidden" style={{ background: `linear-gradient(120deg, ${primaryColor}, ${primaryColor}cc)` }}>
                        <div className="px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-white/70 text-xs uppercase tracking-widest font-extrabold mb-2">More Deals</p>
                                <h3 className="text-2xl font-extrabold text-white">Explore Our Full Shop</h3>
                                <p className="text-white/70 text-sm mt-1">{rest.length} more products waiting!</p>
                            </div>
                            <a href="#all" className="flex-shrink-0 bg-white font-extrabold px-7 py-3.5 rounded-2xl text-sm hover:bg-opacity-90 transition" style={{ color: primaryColor }}>
                                Browse All →
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* All Products */}
            {rest.length > 0 && (
                <section id="all" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-8">All Products</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {rest.map((product) => (
                            <div key={product.id} className="group bg-white border-2 border-gray-100 rounded-3xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-gray-200" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-extrabold text-gray-900 text-sm truncate mb-2">{product.title}</p>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-sm font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {products.length === 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 py-24 text-center">
                    <PackageOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" strokeWidth={1} />
                    <p className="text-gray-400 font-bold">No products yet. Check back soon!</p>
                </section>
            )}

            {/* Footer */}
            <footer style={{ backgroundColor: primaryColor }} className="py-10 mt-8">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-white font-extrabold text-base">{shop.shop_name}</span>
                    <p className="text-white/70 text-xs">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                    <p className="text-white/40 text-xs">Powered by <span className="font-extrabold text-white">MyShop</span></p>
                </div>
            </footer>
        </div>
    );
}
