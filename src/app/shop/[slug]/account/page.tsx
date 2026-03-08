import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Package, Receipt, ArrowRight, UserCircle, LogOut } from 'lucide-react';
import { redirect } from 'next/navigation';
import AccountClient from '@/components/shop/AccountClient';

export default async function CustomerAccountPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Verify Shop
    const { data: shop } = await supabase.from('shops').select('*').eq('route_path', slug).single();
    if (!shop) return <div className="p-8 text-center">Store not found</div>;

    // 2. Verify Session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        redirect(`/shop/${slug}/login`);
    }

    // 3. Fetch Orders for THIS specific customer in THIS specific shop
    // We filter by customer_email because our current schema records the email on the order.
    // In a fully normalized schema, we'd relate `auth.users.id` directly to `orders.customer_id`.
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            id,
            total_amount,
            status,
            invoice_url,
            created_at,
            order_items ( id )
        `)
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
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <UserCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">My Account</h1>
                            <p className={`${tStyles.textMuted} font-medium`}>{session.user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/shop/${slug}`} className={`px-4 py-2 rounded-lg font-medium text-sm border ${tStyles.card} hover:opacity-80 transition-opacity`}>
                            Continue Shopping
                        </Link>
                        {/* We use a Client Component here to handle the Logout onClick action */}
                        <AccountClient slug={slug} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">

                    {/* Sidebar navigation (Mock) */}
                    <div className="lg:col-span-1 space-y-1">
                        <button className={`w-full text-left px-4 py-3 rounded-xl font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>
                            Order History
                        </button>
                        <button className={`w-full text-left px-4 py-3 rounded-xl font-medium ${tStyles.textMuted} hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors`}>
                            Saved Addresses
                        </button>
                        <button className={`w-full text-left px-4 py-3 rounded-xl font-medium ${tStyles.textMuted} hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors`}>
                            Account Settings
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <h2 className="text-xl font-bold mb-6">Recent Orders</h2>

                        {!orders || orders.length === 0 ? (
                            <div className={`p-12 text-center border-2 border-dashed rounded-3xl ${tStyles.card}`}>
                                <Package className={`w-12 h-12 mx-auto mb-4 ${tStyles.textMuted} opacity-50`} />
                                <h3 className="text-lg font-bold mb-2">No orders yet</h3>
                                <p className={`${tStyles.textMuted} mb-6`}>Looks like you haven't placed any orders with {shop.shop_name} yet.</p>
                                <Link href={`/shop/${slug}`} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div key={order.id} className={`p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition hover:shadow-md ${tStyles.card}`}>

                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-lg">Order #{order.id.split('-')[0].toUpperCase()}</span>
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
                                                    ${order.status === 'processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : ''}
                                                    ${order.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : ''}
                                                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : ''}
                                                `}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${tStyles.textMuted}`}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                            <p className={`text-sm ${tStyles.textMuted}`}>{order.order_items?.length || 0} items • <span className="font-semibold text-gray-900 dark:text-gray-100">රු {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
                                        </div>

                                        <div className="flex items-center gap-3 sm:w-auto w-full">
                                            {order.invoice_url && (
                                                <Link href={order.invoice_url} target="_blank" className={`flex-1 sm:flex-none flex justify-center items-center p-3 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition ${tStyles.textMuted}`}>
                                                    <Receipt className="w-5 h-5" />
                                                </Link>
                                            )}
                                            <Link href={`/shop/${slug}/order/${order.id}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 font-bold transition">
                                                Track Shipment
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
