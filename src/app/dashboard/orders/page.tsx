'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Package, Search, ChevronDown, CheckCircle, Truck, Clock, X, ExternalLink, XCircle,
    Box, MapPin, Mail, Phone, Receipt, SendHorizonal, Loader2, Pencil, Check, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    processing: { label: 'Processing', bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock },
    packed:     { label: 'Packed',     bg: 'bg-violet-50',  text: 'text-violet-700',  icon: Box },
    shipped:    { label: 'Shipped',    bg: 'bg-blue-50',    text: 'text-blue-700',    icon: Truck },
    delivered:  { label: 'Delivered',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
    cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-700',     icon: XCircle },
};

const CARRIERS = ['SL Post', 'Pronto', 'Aramex', 'DHL', 'FedEx', 'PickMe Flash', 'Other'];

interface TrackingEditState {
    orderId: string;
    number: string;
    carrier: string;
    url: string;
}

export default function OrdersDashboard() {
    const supabase = createClient();
    const [orders, setOrders] = useState<any[]>([]);
    const [shopRoute, setShopRoute] = useState('');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [trackingEdit, setTrackingEdit] = useState<TrackingEditState | null>(null);
    const [savingTracking, setSavingTracking] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data: shop } = await supabase.from('shops').select('id, route_path').eq('owner_id', user.id).single();
            if (shop) {
                setShopRoute(shop.route_path);
                const { data: ords } = await supabase
                    .from('orders')
                    .select('*, order_items(quantity, unit_price, products(title, image_urls))')
                    .eq('shop_id', shop.id)
                    .order('created_at', { ascending: false });
                setOrders(ords || []);
            }
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const now = new Date().toISOString();
        const tsField: Record<string, string> = {
            packed: 'packed_at', shipped: 'shipped_at', delivered: 'delivered_at'
        };
        const update: Record<string, any> = { status: newStatus };
        if (tsField[newStatus]) update[tsField[newStatus]] = now;
        setOrders(orders.map(o => o.id === orderId ? { ...o, ...update } : o));
        await supabase.from('orders').update(update).eq('id', orderId);
    };

    const openTrackingEdit = (order: any) => {
        setTrackingEdit({
            orderId: order.id,
            number: order.tracking_number || '',
            carrier: order.tracking_carrier || '',
            url: order.tracking_url || '',
        });
    };

    const saveTracking = async () => {
        if (!trackingEdit) return;
        setSavingTracking(true);
        const update = {
            tracking_number: trackingEdit.number,
            tracking_carrier: trackingEdit.carrier,
            tracking_url: trackingEdit.url,
        };
        await supabase.from('orders').update(update).eq('id', trackingEdit.orderId);
        setOrders(orders.map(o => o.id === trackingEdit.orderId ? { ...o, ...update } : o));
        setTrackingEdit(null);
        setSavingTracking(false);
    };

    const handleSendEmail = async (order: any) => {
        setSendingEmail(order.id);
        try {
            const res = await fetch('/api/orders/send-tracking-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, shopRoute }),
            });
            const json = await res.json();
            if (res.ok) {
                setEmailSuccess(order.id);
                await supabase.from('orders').update({ email_sent_at: new Date().toISOString() }).eq('id', order.id);
                setOrders(orders.map(o => o.id === order.id ? { ...o, email_sent_at: new Date().toISOString() } : o));
                setTimeout(() => setEmailSuccess(null), 3000);
            } else {
                alert(json.error || 'Failed to send email.');
            }
        } catch {
            alert('Email service unavailable. Check RESEND_API_KEY in .env.local');
        } finally {
            setSendingEmail(null);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
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
    const shipped = orders.filter(o => o.status === 'shipped').length;

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
                <p className="text-sm text-gray-400 mt-0.5">Manage fulfillment, set tracking numbers, and send customer emails</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', value: orders.length, color: 'blue' },
                    { label: 'Pending', value: processing, color: 'orange', sub: 'Need fulfillment' },
                    { label: 'Shipped', value: shipped, color: 'indigo' },
                    { label: 'Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, color: 'green', sub: `${delivered} delivered` },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color === 'blue' ? 'text-blue-600' : s.color === 'orange' ? 'text-orange-500' : s.color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'}`}>{s.value}</p>
                        {s.sub && <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3">
                <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Search by order ID, email, or customer name..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-7 h-7 text-blue-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{search ? 'No orders found' : 'No orders yet'}</h3>
                    <p className="text-sm text-gray-400">{search ? `No match for "${search}".` : 'Customer orders will appear here.'}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map(order => {
                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
                        const StatusIcon = cfg.icon;
                        const isExpanded = expandedOrder === order.id;
                        const isEditingTracking = trackingEdit?.orderId === order.id;
                        const emailSent = emailSuccess === order.id;

                        return (
                            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all">
                                {/* ── ROW ── */}
                                <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                                    {/* Order ID */}
                                    <div className="min-w-[110px]">
                                        <p className="font-mono font-bold text-blue-600 text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Customer */}
                                    <div className="flex-1 min-w-[130px]">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{order.customer_name || '—'}</p>
                                        <p className="text-xs text-gray-400 truncate">{order.customer_email || 'No email'}</p>
                                    </div>

                                    {/* Total */}
                                    <div className="text-right min-w-[90px]">
                                        <p className="font-bold text-gray-900 text-sm">Rs. {Number(order.total_amount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">{order.order_items?.length || 0} item(s)</p>
                                    </div>

                                    {/* Status dropdown */}
                                    <div className="relative inline-flex items-center">
                                        <span className={`absolute left-2.5 pointer-events-none ${cfg.text}`}><StatusIcon className="w-3 h-3" /></span>
                                        <select
                                            value={order.status}
                                            onChange={e => handleStatusChange(order.id, e.target.value)}
                                            className={`appearance-none pl-7 pr-7 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${cfg.bg} ${cfg.text} border-transparent`}
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="packed">Packed</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <ChevronDown className={`absolute right-2 w-3 h-3 pointer-events-none ${cfg.text}`} />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={`/shop/${shopRoute}/invoice/${order.id}`}
                                            target="_blank"
                                            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                                        >
                                            <Receipt className="w-3.5 h-3.5" /> Invoice
                                        </Link>
                                        <Link
                                            href={`/shop/${shopRoute}/order/${order.id}`}
                                            target="_blank"
                                            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Track
                                        </Link>
                                        <button
                                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                            className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition"
                                        >
                                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── EXPANDED DETAIL PANEL ── */}
                                {isExpanded && (
                                    <div className="border-t border-gray-50 bg-gray-50/40 px-5 py-5 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                                            {/* Customer Info */}
                                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</p>
                                                <div className="space-y-1.5 text-sm">
                                                    {order.customer_name && <p className="font-semibold text-gray-900">{order.customer_name}</p>}
                                                    {order.customer_email && <p className="text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{order.customer_email}</p>}
                                                    {order.customer_phone && <p className="text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{order.customer_phone}</p>}
                                                </div>
                                            </div>

                                            {/* Shipping Address */}
                                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ship To</p>
                                                <div className="text-sm text-gray-600">
                                                    {order.customer_address ? (
                                                        <p className="flex items-start gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <span>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}{order.customer_postal ? ` ${order.customer_postal}` : ''}</span>
                                                        </p>
                                                    ) : <p className="text-gray-400 italic">No address</p>}
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                                                <div className="space-y-1">
                                                    {order.order_items?.map((item: any, idx: number) => (
                                                        <p key={idx} className="text-sm text-gray-600 truncate">
                                                            <span className="font-bold text-gray-800">{item.quantity}×</span> {item.products?.title || '—'}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tracking Number Input */}
                                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Truck className="w-3.5 h-3.5" /> Tracking Info
                                                </p>
                                                {!isEditingTracking && (
                                                    <button
                                                        onClick={() => openTrackingEdit(order)}
                                                        className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 transition"
                                                    >
                                                        <Pencil className="w-3 h-3" /> {order.tracking_number ? 'Edit' : 'Add Tracking'}
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingTracking ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 font-medium mb-1">Carrier</label>
                                                            <select
                                                                value={trackingEdit!.carrier}
                                                                onChange={e => setTrackingEdit(t => t ? { ...t, carrier: e.target.value } : t)}
                                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                            >
                                                                <option value="">Select carrier</option>
                                                                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 font-medium mb-1">Tracking Number</label>
                                                            <input
                                                                type="text"
                                                                value={trackingEdit!.number}
                                                                onChange={e => setTrackingEdit(t => t ? { ...t, number: e.target.value } : t)}
                                                                placeholder="e.g. SLP1234567890"
                                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 font-medium mb-1">Tracking URL (optional)</label>
                                                        <input
                                                            type="url"
                                                            value={trackingEdit!.url}
                                                            onChange={e => setTrackingEdit(t => t ? { ...t, url: e.target.value } : t)}
                                                            placeholder="https://track.slpost.lk/..."
                                                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setTrackingEdit(null)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Cancel</button>
                                                        <button onClick={saveTracking} disabled={savingTracking} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-2 disabled:opacity-60">
                                                            {savingTracking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : order.tracking_number ? (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {order.tracking_carrier && <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{order.tracking_carrier}</span>}
                                                    <span className="font-mono text-sm font-bold text-blue-700">{order.tracking_number}</span>
                                                    {order.tracking_url && (
                                                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Open tracker →</a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No tracking number added yet</p>
                                            )}
                                        </div>

                                        {/* Send Email */}
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="text-xs text-gray-400">
                                                {order.email_sent_at
                                                    ? `✓ Email sent ${new Date(order.email_sent_at).toLocaleDateString()}`
                                                    : 'No notification email sent yet'
                                                }
                                            </div>
                                            <button
                                                onClick={() => handleSendEmail(order)}
                                                disabled={sendingEmail === order.id || !order.customer_email}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                                                    emailSent
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                                                }`}
                                            >
                                                {sendingEmail === order.id ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                                ) : emailSent ? (
                                                    <><Check className="w-4 h-4" /> Sent!</>
                                                ) : (
                                                    <><SendHorizonal className="w-4 h-4" /> Send Tracking Email</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {orders.length > 0 && (
                <p className="text-xs text-gray-400 text-center pb-4">{filteredOrders.length} of {orders.length} orders shown</p>
            )}
        </div>
    );
}
