import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

interface Props {
    params: { slug: string };
}

export default async function AdminShopDetailPage({ params }: Props) {
    const supabase = await createClient();

    const { data: shop, error } = await supabase
        .from('shops')
        .select('id, shop_name, route_path, is_approved, template, primary_color, created_at, owner_id')
        .eq('route_path', params.slug)
        .maybeSingle();

    if (error || !shop) {
        notFound();
    }

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{shop.shop_name}</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Shop slug: <span className="font-mono text-amber-400">{shop.route_path}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/shops" className="text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition">
                        Back to Shops
                    </Link>
                    <Link href={`/shop/${shop.route_path}`} target="_blank" className="text-sm px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition">
                        Preview Store
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <p className={`font-semibold ${shop.is_approved ? 'text-green-400' : 'text-amber-400'}`}>
                        {shop.is_approved ? 'Approved / Live' : 'Pending Approval'}
                    </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Template</p>
                    <p className="font-semibold text-gray-100">{shop.template || 'minimal-white'}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Owner ID</p>
                    <p className="font-mono text-xs text-gray-300 break-all">{shop.owner_id}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</p>
                    <p className="font-semibold text-gray-100">{new Date(shop.created_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
