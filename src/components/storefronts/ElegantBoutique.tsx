import React from 'react';
import { PackageOpen, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
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

export default function ElegantBoutique({ shop, products, onAddToCart, cartCount = 0, onOpenCart, sessionUser, customerDisplayName, onLogout }: Props) {
    const primaryColor = shop.primary_color || '#7C3AED';
    const featured = products.slice(0, 3);
    const rest = products.slice(3);

    return (
        <div style={{ fontFamily: `'Cormorant Garamond', 'Playfair Display', '${shop.font}', serif` }} className="min-h-screen bg-[#FBF9F7] text-stone-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div className="bg-stone-900 text-stone-100 text-center text-xs py-2.5 px-4 font-sans font-medium tracking-[0.2em] uppercase">
                    {shop.announcement_bar}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-stone-200 sticky top-0 bg-[#FBF9F7]/98 backdrop-blur-sm z-20">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="h-16 flex items-center justify-between gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.shop_name} className="h-9 w-auto object-contain" />
                            ) : (
                                <div style={{ borderColor: primaryColor }} className="w-9 h-9 rounded-full border-2 flex items-center justify-center">
                                    <span style={{ color: primaryColor }} className="font-light text-sm">{shop.shop_name[0]}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-sm font-semibold tracking-[0.15em] uppercase text-stone-900 font-sans">{shop.shop_name}</span>
                                {shop.tagline && <p className="text-xs text-stone-400 tracking-widest font-sans font-light leading-none mt-0.5">{shop.tagline}</p>}
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-10 text-xs uppercase tracking-[0.2em] text-stone-400 font-sans font-medium">
                            <a href="#products" className="hover:text-stone-900 transition-colors">Collections</a>
                            <a href="#features" className="hover:text-stone-900 transition-colors">Our Story</a>
                        </nav>

                        <div className="flex items-center gap-3">
                            {!sessionUser && (
                                <>
                                    <a href={`/shop/${shop.route_path}/login`} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-stone-900 px-3 py-1.5 transition">
                                        Login
                                    </a>
                                    <a href={`/shop/${shop.route_path}/signup`} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-stone-900 px-3 py-1.5 transition">
                                        Signup
                                    </a>
                                </>
                            )}
                            {sessionUser ? (
                                <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-stone-900 px-3 py-1.5 transition">
                                    {customerDisplayName || 'Account'}
                                </a>
                            ) : (
                                <a href={`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/orders`)}`} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-stone-900 px-3 py-1.5 transition">
                                    My Orders
                                </a>
                            )}
                            {Boolean(sessionUser) && (
                                <>
                                    <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-stone-900 px-3 py-1.5 transition">
                                        My Orders
                                    </a>
                                    <button onClick={onLogout} className="hidden sm:flex items-center text-xs uppercase tracking-[0.15em] font-sans font-medium text-stone-400 hover:text-red-500 px-3 py-1.5 transition">
                                        Logout
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onOpenCart}
                                className="relative text-xs px-5 py-2.5 border border-stone-300 font-sans font-medium tracking-[0.15em] uppercase hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all flex items-center gap-2"
                                style={{ color: 'inherit' }}
                            >
                                Bag
                                {cartCount > 0 && (
                                    <span style={{ backgroundColor: primaryColor }} className="text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">{cartCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section
                className="relative overflow-hidden"
                style={shop.banner_url ? { backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!shop.banner_url && <div style={{ background: `linear-gradient(160deg, ${primaryColor}10 0%, transparent 60%)` }} className="absolute inset-0" />}
                {shop.banner_url && <div className="absolute inset-0 bg-stone-900/50" />}
                <div className={`relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-28 md:py-48 ${shop.banner_url ? 'text-white' : 'text-stone-900'}`}>
                    <div className="max-w-lg">
                        <p
                            className="text-xs tracking-[0.3em] uppercase font-sans font-medium mb-6"
                            style={{ color: shop.banner_url ? 'rgba(255,255,255,0.6)' : primaryColor }}
                        >
                            {shop.tagline || 'Premium Collection'}
                        </p>
                        <h1 className="text-5xl md:text-7xl font-light tracking-[0.04em] leading-none mb-10">
                            {shop.shop_name}
                        </h1>
                        <div className="flex items-center gap-4">
                            <a
                                href="#products"
                                style={!shop.banner_url ? { backgroundColor: primaryColor } : {}}
                                className={`inline-flex items-center text-xs px-8 py-4 font-sans font-medium tracking-[0.15em] uppercase transition hover:opacity-80 ${shop.banner_url ? 'bg-white text-stone-900' : 'text-white'}`}
                            >
                                View Collection
                            </a>
                            <a
                                href="#features"
                                style={{ color: shop.banner_url ? 'rgba(255,255,255,0.6)' : 'inherit' }}
                                className="text-xs font-sans tracking-widest uppercase font-medium text-stone-400 hover:text-stone-700 transition"
                            >
                                Our Story
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className="border-y border-stone-200 bg-stone-50">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: Truck, label: 'Island-wide Delivery' },
                            { icon: ShieldCheck, label: 'Authentic Products' },
                            { icon: ShoppingBag, label: 'Easy Returns' },
                        ].map(t => (
                            <div key={t.label} className="flex items-center gap-2 text-xs text-stone-400 font-sans tracking-wide">
                                <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} strokeWidth={1.5} />
                                {t.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            {featured.length > 0 && (
                <section id="products" className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
                    <div className="text-center mb-14">
                        <p style={{ color: primaryColor }} className="text-xs tracking-[0.3em] uppercase font-sans font-medium mb-3">Curated For You</p>
                        <h2 className="text-3xl font-light tracking-wide text-stone-900">New Collection</h2>
                        <div style={{ backgroundColor: primaryColor }} className="w-10 h-px mx-auto mt-5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                        {featured.map((product) => (
                            <div key={product.id} className="group">
                                <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-5 relative">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-10 h-10 text-stone-200" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-stone-50/80 flex items-center justify-center">
                                            <span className="text-xs font-sans uppercase tracking-widest text-stone-400">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-medium tracking-wide text-stone-900 text-sm mb-1 font-sans">{product.title}</p>
                                    {product.description && <p className="text-xs text-stone-400 mb-4 line-clamp-2 font-sans font-light leading-relaxed">{product.description}</p>}
                                    <p style={{ color: primaryColor }} className="text-sm font-medium mb-4 tracking-wide font-sans">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</p>
                                    {product.stock_quantity > 0 ? (
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            style={{ borderColor: primaryColor, color: primaryColor }}
                                            className="border text-xs px-6 py-2.5 uppercase tracking-[0.15em] hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all font-sans font-medium"
                                        >
                                            Add to Bag
                                        </button>
                                    ) : (
                                        <span className="text-xs text-stone-300 uppercase tracking-widest font-sans">Sold Out</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Promo Banner */}
            {rest.length > 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-4">
                    <div className="border border-stone-200 rounded-none py-14 px-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-stone-50">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] font-sans font-medium text-stone-400 mb-2">Explore More</p>
                            <h3 className="text-2xl font-light text-stone-900">{rest.length} More Pieces Await</h3>
                        </div>
                        <a
                            href="#all"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                            className="flex-shrink-0 border text-xs px-8 py-3.5 uppercase tracking-[0.15em] font-sans font-medium hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
                        >
                            View All →
                        </a>
                    </div>
                </section>
            )}

            {/* All Products */}
            {rest.length > 0 && (
                <section id="all" className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
                    <h2 className="text-2xl font-light tracking-wide text-stone-900 mb-12 text-center">Full Catalogue</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                        {rest.map((product) => (
                            <div key={product.id} className="group">
                                <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-4 relative">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-stone-200" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-stone-50/80 flex items-center justify-center">
                                            <span className="text-xs font-sans uppercase tracking-widest text-stone-400">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <p className="font-medium tracking-wide text-stone-900 text-sm mb-1 font-sans truncate">{product.title}</p>
                                <div className="flex items-center justify-between">
                                    <p style={{ color: primaryColor }} className="text-sm font-medium font-sans">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</p>
                                    {product.stock_quantity > 0 && (
                                        <button
                                            onClick={() => onAddToCart?.(product)}
                                            style={{ borderColor: primaryColor, color: primaryColor }}
                                            className="border text-xs px-3 py-1.5 uppercase tracking-widest hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all font-sans"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {products.length === 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 py-24 text-center">
                    <PackageOpen className="w-12 h-12 text-stone-200 mx-auto mb-4" strokeWidth={1} />
                    <p className="text-stone-400 font-sans font-light tracking-wide">No pieces available yet.</p>
                </section>
            )}

            {/* Features / Our Story */}
            <section id="features" className="bg-stone-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="text-center mb-12">
                        <p style={{ color: primaryColor }} className="text-xs tracking-[0.3em] uppercase font-sans font-medium mb-3">Our Promise</p>
                        <h2 className="text-3xl font-light text-white">Why Choose Us?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                        {[
                            { icon: Truck, title: 'Island-wide Delivery', desc: 'Fast, reliable delivery across all of Sri Lanka.' },
                            { icon: ShieldCheck, title: 'Authentic Quality', desc: 'Every piece handpicked for quality and craftsmanship.' },
                            { icon: ShoppingBag, title: 'Easy Returns', desc: 'Not satisfied? Return hassle-free within 7 days.' },
                        ].map(f => (
                            <div key={f.title} className="text-center">
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-5">
                                    <f.icon className="w-5 h-5 text-white/50" strokeWidth={1} />
                                </div>
                                <h4 className="font-sans font-medium text-white mb-2 tracking-wide text-sm">{f.title}</h4>
                                <p className="text-stone-400 text-xs font-sans font-light leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-stone-900 border-t border-white/5 py-10">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-sans font-light tracking-[0.2em] uppercase text-stone-500">{shop.shop_name}</span>
                    <p className="text-xs font-sans font-light text-stone-600">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                    <p className="text-xs font-sans text-stone-700">Powered by <span style={{ color: primaryColor }} className="font-medium">MyShop</span></p>
                </div>
            </footer>
        </div>
    );
}
