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

export default function ElegantBoutique({ shop, products }: Props) {
    const primaryColor = shop.primary_color || '#7C3AED';

    return (
        <div style={{ fontFamily: `'${shop.font}', serif` }} className="min-h-screen bg-stone-50 text-stone-900">
            {/* Announcement Bar */}
            {shop.announcement_bar && (
                <div className="bg-stone-900 text-stone-100 text-center text-xs py-2 px-4 font-light tracking-widest uppercase">
                    {shop.announcement_bar}
                </div>
            )}

            {/* Navigation */}
            <header className="border-b border-stone-200 sticky top-0 bg-stone-50/95 backdrop-blur-sm z-10">
                <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name} className="h-12 w-auto object-contain" />
                        ) : (
                            <div style={{ borderColor: primaryColor }} className="w-10 h-10 rounded-full border-2 flex items-center justify-center" >
                                <span style={{ color: primaryColor }} className="font-bold text-lg">{shop.shop_name[0]}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-xl font-bold tracking-widest uppercase">{shop.shop_name}</span>
                            {shop.tagline && <p className="text-xs text-stone-400 tracking-widest mt-0.5">{shop.tagline}</p>}
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-stone-500">
                        <a href="#products" className="hover:text-stone-900 transition-colors">Collections</a>
                        <a href="#" className="hover:text-stone-900 transition-colors">About</a>
                        <a href="#" className="hover:text-stone-900 transition-colors">Contact</a>
                    </nav>
                    <button style={{ borderColor: primaryColor, color: primaryColor }} className="text-sm px-5 py-2 border rounded-none font-medium tracking-widest uppercase hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all">
                        Bag (0)
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section
                className="relative h-[70vh] flex items-center justify-center text-center overflow-hidden"
                style={shop.banner_url ? { backgroundImage: `url(${shop.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!shop.banner_url && (
                    <div style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }} className="absolute inset-0" />
                )}
                {shop.banner_url && <div className="absolute inset-0 bg-stone-900/50" />}
                <div className={`relative z-10 max-w-2xl mx-auto px-8 ${shop.banner_url ? 'text-white' : 'text-stone-900'}`}>
                    <p style={{ color: primaryColor }} className={`text-xs tracking-widest uppercase mb-6 font-light ${shop.banner_url ? 'text-stone-300' : ''}`}>
                        {shop.tagline || 'Premium Collection'}
                    </p>
                    <h1 className="text-6xl font-light tracking-wide mb-8" style={{ letterSpacing: '0.1em' }}>{shop.shop_name}</h1>
                    <a href="#products" style={{ backgroundColor: shop.banner_url ? 'white' : primaryColor, color: shop.banner_url ? primaryColor : 'white' }} className="inline-block px-10 py-3.5 text-xs font-medium tracking-widest uppercase hover:opacity-90 transition-opacity">
                        View Collection
                    </a>
                </div>
            </section>

            {/* Products */}
            <section id="products" className="max-w-6xl mx-auto px-8 py-24">
                <div className="text-center mb-16">
                    <p style={{ color: primaryColor }} className="text-xs tracking-widest uppercase mb-3">Curated Selection</p>
                    <h2 className="text-4xl font-light tracking-wide">Our Collection</h2>
                    <div style={{ backgroundColor: primaryColor }} className="w-12 h-px mx-auto mt-4" />
                </div>
                {products.length === 0 ? (
                    <div className="text-center py-20 text-stone-400">
                        <p className="text-xl font-light tracking-wide">No products available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                        {products.map((product) => (
                            <div key={product.id} className="group">
                                <div className="aspect-[3/4] bg-stone-100 overflow-hidden mb-5">
                                    {product.image_urls?.[0] ? (
                                        <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-stone-100">
                                            <ShoppingBag className="w-12 h-12 text-stone-300" strokeWidth={1} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="font-medium tracking-wide text-stone-900 mb-1">{product.title}</h3>
                                    {product.description && <p className="text-xs text-stone-400 mb-3 line-clamp-2 font-light">{product.description}</p>}
                                    <p style={{ color: primaryColor }} className="text-sm font-medium mb-4">
                                        Rs. {product.price.toLocaleString()}
                                    </p>
                                    {product.stock_quantity > 0 ? (
                                        <button style={{ borderColor: primaryColor, color: primaryColor }} className="border text-xs px-6 py-2 uppercase tracking-widest hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all font-medium">
                                            Add to Bag
                                        </button>
                                    ) : (
                                        <span className="text-xs text-stone-400 uppercase tracking-widest">Sold Out</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="bg-stone-900 text-stone-400 py-12 text-center">
                <div className="flex justify-center mb-6">
                    {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.shop_name} className="h-16 w-auto object-contain grayscale opacity-70" />
                    ) : (
                        <p className="text-xl font-light tracking-widest uppercase text-white">{shop.shop_name}</p>
                    )}
                </div>
                {shop.tagline && <p style={{ color: primaryColor }} className="text-xs tracking-widest uppercase mb-4">{shop.tagline}</p>}
                <p className="text-xs font-light">{shop.footer_text || `© ${new Date().getFullYear()} ${shop.shop_name}. All rights reserved.`}</p>
                <p className="mt-4 text-xs opacity-40">Powered by MyShop</p>
            </footer>
        </div>
    );
}
