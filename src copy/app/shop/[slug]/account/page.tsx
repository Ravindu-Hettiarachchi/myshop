import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Package, Receipt, ArrowRight, UserCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import AccountClient, { LogoutButton, CancelOrderButton } from '@/components/shop/AccountClient';
import CustomerOrdersClient from '@/components/shop/CustomerOrdersClient';

export default async function CustomerAccountPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: shop } = await supabase.from('shops').select('*').eq('route_path', slug).single();
    if (!shop) return <div className="p-8 text-center">Store not found</div>;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect(`/shop/${slug}/login`);

    const { data: orders } = await supabase
        .from('orders')
        .select(`id, total_amount, status, invoice_url, created_at, order_items(id)`)
        .eq('shop_id', shop.id)
        .eq('customer_email', session.user.email)
        .order('created_at', { ascending: false });

    const isDark = shop.template === 'modern-dark';
    const tStyles = {
        bg: isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900',
        card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    };

    return (
        <div className={`min-h-screen ${tStyles.bg} py-12 px-4 sm:px-6 lg:px-8 font-sans`}>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <UserCircle className="w-9 h-9" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">My Account</h1>
                            <p className={`${tStyles.textMuted} text-sm`}>{session.user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/shop/${slug}`} className={`px-4 py-2 rounded-lg font-medium text-sm border ${tStyles.card} hover:opacity-80 transition-opacity`}>
                            ← Continue Shopping
                        </Link>
                        <LogoutButton slug={slug} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-1">
                        <button className="w-full text-left px-4 py-3 rounded-xl font-bold bg-blue-50 text-blue-700">
                            Order History
                        </button>
                    </div>

                    {/* Orders */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold">My Orders</h2>
                            <span className={`text-xs font-medium ${tStyles.textMuted}`}>{orders?.length || 0} orders</span>
                        </div>

                        {!orders || orders.length === 0 ? (
                            <div className={`p-14 text-center border-2 border-dashed rounded-3xl ${tStyles.card}`}>
                                <Package className={`w-12 h-12 mx-auto mb-4 ${tStyles.textMuted} opacity-40`} />
                                <h3 className="text-lg font-bold mb-2">No orders yet</h3>
                                <p className={`${tStyles.textMuted} mb-6 text-sm`}>You haven't placed any orders with {shop.shop_name} yet.</p>
                                <Link href={`/shop/${slug}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition text-sm">
                                    Start Shopping →
                                </Link>
                            </div>
                        ) : (
                            /* Pass to client component so Cancel button can trigger re-renders */
                            <CustomerOrdersClient
                                initialOrders={orders}
                                slug={slug}
                                isDark={isDark}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
