import React from 'react';
import { PackageOpen, ShoppingBag, ShieldCheck, Truck, RefreshCw, Star, CircleUserRound } from 'lucide-react';
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
    customerDisplayName?: string;
    onLogout?: () => void | Promise<void>;
}

export default function MinimalWhite({ shop, products, onAddToCart, cartCount = 0, onOpenCart, sessionUser, customerDisplayName, onLogout }: Props) {
    const primaryColor = shop.primary_color || '#2563EB';
    const featured = products.slice(0, 4);
    const rest = products.slice(4);

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-white text-gray-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-xs py-2.5 px-4 font-semibold tracking-wide">
                    🎉 {shop.announcement_bar}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-gray-100 sticky top-0 bg-white/97 backdrop-blur-sm z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="h-16 flex items-center justify-between gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.shop_name} className="h-9 w-auto object-contain" />
                            ) : (
                                <div style={{ backgroundColor: primaryColor }} className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base">
                                    {shop.shop_name[0]}
                                </div>
                            )}
                            <span className="text-lg font-bold tracking-tight">{shop.shop_name}</span>
                        </div>

                        {/* Nav Links */}
                        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
                            <a href="#products" className="hover:text-gray-900 transition-colors">Products</a>
                            <a href="#features" className="hover:text-gray-900 transition-colors">Why Us</a>
                            <a href="#contact" className="hover:text-gray-900 transition-colors">Contact</a>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {!sessionUser && (
                                <>
                                    <a href={`/shop/${shop.route_path}/login`} className="hidden sm:flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                        Login
                                    </a>
                                    <a href={`/shop/${shop.route_path}/signup`} className="hidden sm:flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                        Signup
                                    </a>
                                </>
                            )}
                            {sessionUser ? (
                                <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                    <CircleUserRound className="w-4 h-4" />
                                    {customerDisplayName || 'Account'}
                                </a>
                            ) : (
                                <a href={`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/orders`)}`} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                    <CircleUserRound className="w-4 h-4" />
                                    My Orders
                                </a>
                            )}
                            {Boolean(sessionUser) && (
                                <>
                                    <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                        My Orders
                                    </a>
                                    <button
                                        onClick={onLogout}
                                        className="hidden sm:flex items-center text-sm font-medium text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onOpenCart}
                                style={{ backgroundColor: primaryColor }}
                                className="relative text-white text-sm px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition flex items-center gap-2"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span className="hidden sm:inline">Cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: shop.banner_url
                        ? `url(${shop.banner_url}) center/cover`
                        : `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 50%, white 100%)`
                }}
            >
                {shop.banner_url && <div className="absolute inset-0 bg-white/70" />}
                <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-20 md:py-32">
                    <div className="max-w-2xl">
                        <div style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
                            <Star className="w-3 h-3 fill-current" />
                            {shop.tagline || 'New Arrivals'}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-5">
                            Shop the<br />
                            <span style={{ color: primaryColor }}>Latest Collection</span>
                        </h1>
                        <p className="text-gray-500 text-lg mb-8 leading-relaxed max-w-md">
                            Discover curated products at unbeatable prices. Quality you can trust, delivered to your door.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <a
                                href="#products"
                                style={{ backgroundColor: primaryColor }}
                                className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-bold hover:opacity-90 transition text-sm shadow-lg"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Shop Now
                            </a>
                            <a href="#features" style={{ color: primaryColor }} className="text-sm font-semibold hover:underline underline-offset-2 transition">
                                Learn more →
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
                            { icon: Truck, label: 'Fast Island-wide Delivery' },
                            { icon: ShieldCheck, label: 'Secure Payments' },
                            { icon: RefreshCw, label: 'Easy Returns' },
                            { icon: Star, label: 'Top Rated Products' },
                        ].map(t => (
                            <div key={t.label} className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                                <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} strokeWidth={2} />
                                {t.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featured.length > 0 && (
                <section id="products" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Top Picks</p>
                            <h2 className="text-2xl font-extrabold text-gray-900">Featured Products</h2>
                        </div>
                        <a href="#all-products" className="text-sm font-semibold hover:underline" style={{ color: primaryColor }}>View All →</a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {featured.map((product) => (
                            <div key={product.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-200">Sold Out</span>
                                        </div>
                                    )}
                                    {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Only {product.stock_quantity} left!</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="font-semibold text-gray-900 text-sm truncate mb-0.5">{product.title}</p>
                                    {product.description && <p className="text-xs text-gray-400 line-clamp-1 mb-3">{product.description}</p>}
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-base font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        >
                                            {product.stock_quantity > 0 ? '+ Add' : 'Sold'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Promo Banner (if more products) */}
            {rest.length > 0 && (
                <section style={{ background: `linear-gradient(120deg, ${primaryColor}, ${primaryColor}cc)` }} className="mx-5 lg:mx-10 rounded-3xl overflow-hidden my-4">
                    <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">Explore More</p>
                            <h3 className="text-2xl font-extrabold text-white">Discover Our Full Range</h3>
                            <p className="text-white/70 mt-1 text-sm">{rest.length} more products waiting for you</p>
                        </div>
                        <a href="#all-products" className="flex-shrink-0 bg-white font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-opacity-90 transition" style={{ color: primaryColor }}>
                            Browse All →
                        </a>
                    </div>
                </section>
            )}

            {/* All Products */}
            {rest.length > 0 && (
                <section id="all-products" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>Catalogue</p>
                            <h2 className="text-2xl font-extrabold text-gray-900">All Products</h2>
                        </div>
                        <p className="text-sm text-gray-400">{products.length} items total</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {rest.map((product) => (
                            <div key={product.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
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
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="font-semibold text-gray-900 text-sm truncate mb-2">{product.title}</p>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-sm font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
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

            {/* Empty state */}
            {products.length === 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 py-24">
                    <div className="text-center flex flex-col items-center gap-4">
                        <PackageOpen className="w-16 h-16 text-gray-200" strokeWidth={1} />
                        <p className="text-gray-400 font-medium">No products available yet. Check back soon!</p>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section id="features" className="bg-gray-50 border-t border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-extrabold text-gray-900">Why Shop With Us?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Truck, title: 'Island-Wide Delivery', desc: 'Fast and reliable shipping across all of Sri Lanka.' },
                            { icon: ShieldCheck, title: '100% Secure', desc: 'Encrypted payments and buyer protection guaranteed.' },
                            { icon: RefreshCw, title: 'Easy Returns', desc: 'Not satisfied? Return it hassle-free within 7 days.' },
                        ].map(f => (
                            <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                                    <f.icon className="w-5 h-5" style={{ color: primaryColor }} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1.5">{f.title}</h4>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white py-10">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {shop.logo_url
                            ? <img src={shop.logo_url} alt={shop.shop_name} className="h-7 w-auto object-contain opacity-60" />
                            : <span className="text-sm font-bold text-gray-400">{shop.shop_name}</span>
                        }
                    </div>
                    <p className="text-xs text-gray-400">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                    <p className="text-xs text-gray-300">Powered by <span style={{ color: primaryColor }} className="font-bold">MyShop</span></p>
                </div>
            </footer>
        </div>
    );
}
