import React from 'react';
import { PackageOpen, ShoppingBag, ShieldCheck, Truck, Zap } from 'lucide-react';
import { formatPriceWithUnit, type ProductUnit } from '@/lib/products';

interface Product {
    id: string;
    title: string;
    description: string | null;
    price: number;
    compare_at_price?: number | null;
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

export default function ModernDark({ shop, products, onAddToCart, cartCount = 0, onOpenCart, sessionUser, customerDisplayName, onLogout }: Props) {
    const primaryColor = shop.primary_color || '#7C3AED';
    const featured = products.slice(0, 4);
    const saleItems = products.filter(p => p.compare_at_price != null && p.compare_at_price > p.price);
    const rest = products.slice(4);

    return (
        <div style={{ fontFamily: `'${shop.font}', sans-serif` }} className="min-h-screen bg-[#080810] text-white">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div style={{ backgroundColor: primaryColor }} className="text-white text-center text-xs py-2.5 px-4 font-semibold tracking-wide">
                    ✦ {shop.announcement_bar} ✦
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-white/[0.05] sticky top-0 bg-[#080810]/97 backdrop-blur-md z-20">
                <div className="max-w-7xl mx-auto px-5 lg:px-10">
                    <div className="h-16 flex items-center justify-between gap-4">
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
                        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50 font-medium">
                            <a href="#products" className="hover:text-white transition-colors">Products</a>
                            <a href="#features" className="hover:text-white transition-colors">Features</a>
                        </nav>
                        <div className="flex items-center gap-2">
                            {!sessionUser && (
                                <>
                                    <a href={`/shop/${shop.route_path}/login`} className="hidden sm:flex items-center text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
                                        Login
                                    </a>
                                    <a href={`/shop/${shop.route_path}/signup`} className="hidden sm:flex items-center text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
                                        Signup
                                    </a>
                                </>
                            )}
                            {sessionUser ? (
                                <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center text-sm text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
                                    {customerDisplayName || 'Account'}
                                </a>
                            ) : (
                                <a href={`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/orders`)}`} className="hidden sm:flex items-center text-sm text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
                                    My Orders
                                </a>
                            )}
                            {Boolean(sessionUser) && (
                                <>
                                    <a href={`/shop/${shop.route_path}/orders`} className="hidden sm:flex items-center text-sm text-white/50 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
                                        My Orders
                                    </a>
                                    <button onClick={onLogout} className="hidden sm:flex items-center text-sm text-white/50 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
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
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden min-h-[560px] flex items-center">
                {/* Background glow orbs */}
                <div style={{ backgroundColor: primaryColor }} className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none" />
                <div style={{ backgroundColor: primaryColor }} className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-5 blur-[100px] pointer-events-none" />
                {shop.banner_url && (
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#080810] via-[#080810]/80 to-transparent" />
                <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 py-24">
                    <div className="max-w-xl">
                        <div style={{ color: primaryColor }} className="text-xs font-bold uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                            <span className="w-6 h-px" style={{ backgroundColor: primaryColor }} />
                            {shop.tagline || 'Premium Collection'}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none mb-6">
                            <span className="text-white">The Future of</span><br />
                            <span style={{ color: primaryColor }}>{shop.shop_name}</span>
                        </h1>
                        <p className="text-white/40 text-lg mb-10 leading-relaxed">
                            Experience premium quality products, curated for those who demand excellence.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#products" style={{ backgroundColor: primaryColor }} className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-bold hover:opacity-90 transition text-sm">
                                <ShoppingBag className="w-4 h-4" />
                                Shop Now
                            </a>
                            <a href="#features" className="text-white/40 text-sm font-semibold hover:text-white/70 transition">
                                Learn more →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Strip */}
            <section className="border-y border-white/[0.05] bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { icon: Truck, label: 'Fast Island-wide Delivery' },
                            { icon: ShieldCheck, label: 'Secure & Safe Payments' },
                            { icon: Zap, label: 'Premium Quality Guaranteed' },
                        ].map(t => (
                            <div key={t.label} className="flex items-center gap-2 text-xs text-white/30 font-medium">
                                <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} strokeWidth={1.5} />
                                {t.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured */}
            {featured.length > 0 && (
                <section id="products" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p style={{ color: primaryColor }} className="text-xs font-bold uppercase tracking-[0.3em] mb-1">Selected</p>
                            <h2 className="text-2xl font-extrabold text-white">Featured Collection</h2>
                        </div>
                        {rest.length > 0 && <a href="#all" style={{ color: primaryColor }} className="text-sm font-semibold hover:opacity-70 transition">View All →</a>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {featured.map((product, i) => (
                            <div
                                key={product.id}
                                onClick={() => onAddToCart?.(product)}
                                className={`group cursor-pointer relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/20 transition-all duration-300 ${i === 0 ? 'sm:row-span-1' : ''}`}
                            >
                                <div className="aspect-square bg-white/5 relative overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-white/10" strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent" />
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-white text-sm mb-0.5 truncate">{product.title}</p>
                                    {product.description && <p className="text-xs text-white/30 line-clamp-1 mb-3">{product.description}</p>}
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-base font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
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

            {/* Promo Banner */}
            {rest.length > 0 && (
                <section className="max-w-7xl mx-auto px-5 lg:px-10 mb-4">
                    <div className="rounded-3xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${primaryColor}88, ${primaryColor}33)` }}>
                        <div className="absolute inset-0 border border-white/10 rounded-3xl" />
                        <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-white/50 text-xs uppercase tracking-widest mb-2">More To Discover</p>
                                <h3 className="text-xl font-extrabold text-white">{rest.length} More Products Await</h3>
                            </div>
                            <a href="#all" className="bg-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-white/90 transition" style={{ color: primaryColor }}>
                                Browse Catalogue →
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {saleItems.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-light text-white tracking-wide">Deals</h2>
                            <span className="bg-indigo-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 mt-1 animate-pulse">Ends Soon</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-zinc-800 ml-8"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {saleItems.map((product) => (
                            <div key={product.id} onClick={() => onAddToCart?.(product)} className="group cursor-pointer bg-zinc-900 border border-indigo-900/40 hover:border-indigo-500/50 transition-all duration-500 rounded-none relative">
                                <div className="aspect-[4/5] bg-zinc-800 relative overflow-hidden">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-12 h-12 text-zinc-700" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 ? (
                                        <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-xs font-medium text-zinc-400 uppercase tracking-[0.2em] border border-zinc-700 px-4 py-2">Sold Out</span>
                                        </div>
                                    ) : (
                                        <>
                                            {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                                                <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">Last {product.stock_quantity}</span>
                                            )}
                                            {product.compare_at_price != null && product.compare_at_price > product.price && product.stock_quantity > 0 && (
                                                <span className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest animate-pulse">Sale</span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-medium text-white tracking-wide text-lg mb-1 truncate">{product.title}</h3>
                                    {product.description && <p className="text-sm text-zinc-500 line-clamp-1 mb-4">{product.description}</p>}
                                    <div className="flex flex-col gap-3 mt-3">
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: primaryColor }} className="text-lg font-bold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                            {product.compare_at_price != null && product.compare_at_price > product.price && (
                                                <span className="text-xs text-zinc-600 line-through">Rs. {product.compare_at_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                                            disabled={product.stock_quantity === 0}
                                            className={`text-[10px] tracking-widest uppercase font-bold w-full py-2.5 transition-all ${product.stock_quantity > 0 ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                                        >
                                            {product.stock_quantity > 0 ? 'Claim Deal' : 'Sold'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* All Products */}
            {rest.length > 0 && (
                <section id="all" className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
                    <h2 className="text-2xl font-extrabold text-white mb-8">All Products</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {rest.map((product) => (
                            <div key={product.id} onClick={() => onAddToCart?.(product)} className="group cursor-pointer bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300">
                                <div className="aspect-square bg-white/5 overflow-hidden relative">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-white/10" strokeWidth={1} />
                                        </div>
                                    )}
                                    {product.stock_quantity === 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-xs text-white/30 uppercase tracking-widest">Sold Out</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-white text-sm truncate mb-2">{product.title}</p>
                                    <div className="flex items-center justify-between">
                                        <span style={{ color: primaryColor }} className="text-sm font-extrabold">{formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
                                            disabled={product.stock_quantity === 0}
                                            style={{ backgroundColor: product.stock_quantity > 0 ? primaryColor : undefined }}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${product.stock_quantity > 0 ? 'text-white hover:opacity-85' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
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
                    <PackageOpen className="w-16 h-16 text-white/10 mx-auto mb-4" strokeWidth={1} />
                    <p className="text-white/20 font-medium">No products yet. Check back soon!</p>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t border-white/[0.05] py-10 mt-8">
                <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-sm font-bold text-white/30">{shop.shop_name}</span>
                    <p className="text-xs text-white/15">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                    <p className="text-xs text-white/10">Powered by <span style={{ color: primaryColor }} className="font-bold">MyShop</span></p>
                </div>
            </footer>
        </div>
    );
}
