import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StorefrontClient from '@/components/shop/StorefrontClient';
import { Clock, Eye, Edit2, ArrowLeft } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function ShopPage({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Fetch the shop by route_path
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('route_path', slug)
        .single();

    if (shopError || !shop) {
        notFound();
    }

    // 2. Fetch the full theme config row (needed to decide coded vs custom)
    const { data: resolvedTheme } = await supabase
        .from('themes')
        .select('*')
        .eq('slug', shop.template)
        .maybeSingle();

    // Check if the currently logged-in user is the owner of this shop
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = user?.id === shop.owner_id;

    // If shop is NOT approved AND the viewer is NOT the owner → show Coming Soon
    if (!shop.is_approved && !isOwner) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{
                    fontFamily: `'${shop.font || 'Inter'}', sans-serif`,
                    background: `linear-gradient(135deg, ${shop.primary_color || '#3B82F6'}15, #f9fafb)`
                }}
            >
                <div className="text-center max-w-lg mx-auto px-6">
                    <div
                        style={{ backgroundColor: shop.primary_color || '#3B82F6' }}
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-xl"
                    >
                        {shop.shop_name[0]}
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">{shop.shop_name}</h1>
                    {shop.tagline && <p className="text-gray-500 text-lg mb-6">{shop.tagline}</p>}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
                        <Clock className="w-12 h-12 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon!</h2>
                        <p className="text-gray-500 text-sm">
                            This shop is currently under review. We&apos;re verifying their business details.
                            Check back soon — it won&apos;t be long!
                        </p>
                    </div>
                    <p className="mt-8 text-xs text-gray-400">
                        Powered by <span style={{ color: shop.primary_color || '#3B82F6' }} className="font-semibold">MyShop</span>
                    </p>
                </div>
            </div>
        );
    }

    // Fetch products — both for approved shops (public) and for owner preview
    const { data: products } = await supabase
        .from('products')
        .select('id, title, description, price, stock_quantity, image_urls')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

    const shopConfig = {
        id: shop.id,
        shop_name: shop.shop_name,
        route_path: shop.route_path,
        template: shop.template || 'minimal-white',
        tax_rate: shop.tax_rate,
        tagline: shop.tagline || null,
        primary_color: shop.primary_color || '#3B82F6',
        font: shop.font || 'Inter',
        banner_url: shop.banner_url || null,
        logo_url: shop.logo_url || null,
        announcement_bar: shop.announcement_bar || null,
        footer_text: shop.footer_text || null,
    };

    const productList = products || [];

    // Owner Preview Mode: wrap the storefront in a preview banner
    if (!shop.is_approved && isOwner) {
        return (
            <div className="relative">
                {/* Sticky Preview Mode Banner */}
                <div className="sticky top-0 z-50 w-full bg-amber-500 text-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Eye className="w-6 h-6" />
                            <div>
                                <p className="font-bold text-sm leading-tight">Preview Mode — Not Live Yet</p>
                                <p className="text-xs text-amber-100 leading-tight">Only you can see this. Your shop is still under admin review.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link
                                href="/dashboard/settings"
                                className="text-xs bg-white text-amber-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-50 transition whitespace-nowrap flex items-center gap-1"
                            >
                                <Edit2 className="w-3 h-3" /> Edit Shop
                            </Link>
                            <Link
                                href="/dashboard"
                                className="text-xs bg-amber-600 border border-amber-400 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700 transition whitespace-nowrap flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" /> Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Actual Storefront (fully rendered, just not public) */}
                <StorefrontClient routePath={slug} shopConfig={shopConfig as any} productList={productList} sessionUserInit={user} themeConfig={resolvedTheme} />
            </div>
        );
    }

    // Fully live shop — render without any banner
    return <StorefrontClient routePath={slug} shopConfig={shopConfig as any} productList={productList} sessionUserInit={user} themeConfig={resolvedTheme} />;
}
