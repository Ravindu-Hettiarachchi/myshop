'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Package, Search, ChevronDown, CheckCircle, Truck, Clock, X, ExternalLink, XCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: React.ElementType }> = {
    processing: { label: 'Processing', bgClass: 'bg-amber-50', textClass: 'text-amber-700', icon: Clock },
    shipped: { label: 'Shipped', bgClass: 'bg-blue-50', textClass: 'text-blue-700', icon: Truck },
    delivered: { label: 'Delivered', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', bgClass: 'bg-red-50', textClass: 'text-red-700', icon: XCircle },
};

export default function OrdersDashboard() {
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: shop } = await supabase.from('shops').select('id, route_path').eq('owner_id', user.id).single();
            if (shop) {
                const { data: ords } = await supabase
                    .from('orders')
                    .select(`*, order_items(quantity, unit_price, products(title))`)
                    .eq('shop_id', shop.id)
                    .order('created_at', { ascending: false });

                setOrders((ords || []).map(o => ({ ...o, shop_route: shop.route_path })));
            }
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    };

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading orders...</p>
                </div>
            </div>
        );
    }

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
                <p className="text-sm text-gray-400 mt-0.5">View customer orders, update fulfillment status, and generate invoices</p>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Orders', value: orders.length, color: 'blue', sub: 'All time' },
                    { label: 'Pending', value: processing, color: 'orange', sub: 'Needs fulfillment' },
                    { label: 'Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, color: 'green', sub: `${delivered} delivered` },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color === 'blue' ? 'text-blue-600' : s.color === 'orange' ? 'text-orange-500' : 'text-emerald-600'}`}>{s.value}</p>
                        <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3">
                <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Search by order ID or customer email..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Orders Table / Empty */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-7 h-7 text-blue-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{search ? 'No orders found' : 'No orders yet'}</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        {search ? `No order matches "${search}".` : 'Once customers place orders, they will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Order</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Items</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Total</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => {
                                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
                                    const StatusIcon = cfg.icon;

                                    return (
                                        <tr key={order.id} className="hover:bg-blue-50/20 transition-colors">
                                            {/* Order ID */}
                                            <td className="px-5 py-4">
                                                <p className="font-mono font-bold text-blue-600 text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                                                    {order.customer_email || 'Guest'}
                                                </p>
                                                {order.customer_name && (
                                                    <p className="text-xs text-gray-400">{order.customer_name}</p>
                                                )}
                                            </td>

                                            {/* Items */}
                                            <td className="px-5 py-4">
                                                <div className="max-w-[180px] space-y-0.5">
                                                    {order.order_items?.slice(0, 2).map((item: any, idx: number) => (
                                                        <p key={idx} className="text-xs text-gray-500 truncate">
                                                            <span className="font-semibold text-gray-700">{item.quantity}×</span> {item.products?.title || '—'}
                                                        </p>
                                                    ))}
                                                    {(order.order_items?.length || 0) > 2 && (
                                                        <p className="text-xs text-gray-400">+{order.order_items.length - 2} more</p>
                                                    )}
                                                    {!order.order_items?.length && <p className="text-xs text-gray-300 italic">No items</p>}
                                                </div>
                                            </td>

                                            {/* Total */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900">
                                                    Rs. {Number(order.total_amount || 0).toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Status Dropdown */}
                                            <td className="px-5 py-4">
                                                <div className="relative inline-flex items-center">
                                                    <span className={`absolute left-2.5 pointer-events-none ${cfg.textClass}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                    </span>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className={`appearance-none pl-7 pr-7 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition
                                                            ${cfg.bgClass} ${cfg.textClass} border-transparent`}
                                                    >
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <ChevronDown className={`absolute right-2 w-3 h-3 pointer-events-none ${cfg.textClass}`} />
                                                </div>
                                            </td>

                                            {/* Invoice */}
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    href={`/shop/${order.shop_route}/invoice/${order.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Invoice
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
                        <p className="text-xs text-gray-400">{filteredOrders.length} of {orders.length} orders</p>
                    </div>
                </div>
            )}
        </div>
    );
}
