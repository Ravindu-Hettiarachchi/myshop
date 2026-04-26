'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createCustomerClient } from '@/utils/supabase/customer-client';
import { Package, Truck, CheckCircle, Receipt, Clock, Box, MapPin, Mail, Phone, AlertCircle, RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react';
import { formatPriceWithUnit, formatQuantityLabel } from '@/lib/products';

interface ShopData {
    id: string;
    shop_name: string;
    logo_url?: string | null;
    primary_color?: string | null;
}

interface OrderItem {
    quantity: number;
    unit_price: number;
    ordered_quantity?: number | null;
    ordered_unit?: string | null;
    selling_unit?: string | null;
    selling_unit_value?: number | null;
    products?: {
        title?: string | null;
        image_urls?: string[] | null;
    } | null;
}

interface OrderData {
    id: string;
    status: string;
    created_at: string;
    total_amount: number;
    packed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    tracking_number?: string | null;
    tracking_carrier?: string | null;
    tracking_url?: string | null;
    customer_name?: string | null;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    customer_city?: string | null;
    customer_postal?: string | null;
    order_items?: OrderItem[];
}

const STEPS = [
    { id: 'processing', label: 'Processing', sub: 'Order received, being prepared', Icon: Clock },
    { id: 'packed',     label: 'Packed',     sub: 'Packed and ready to ship', Icon: Box },
    { id: 'shipped',    label: 'Shipped',    sub: 'On the way to you', Icon: Truck },
    { id: 'delivered',  label: 'Delivered',  sub: 'Successfully delivered', Icon: CheckCircle },
];

const STATUS_COLOR: Record<string, { ring: string; bg: string; text: string }> = {
    processing: { ring: 'ring-amber-400',  bg: 'bg-amber-500',   text: 'text-amber-600' },
    packed:     { ring: 'ring-violet-400', bg: 'bg-violet-500',  text: 'text-violet-600' },
    shipped:    { ring: 'ring-blue-400',   bg: 'bg-blue-500',    text: 'text-blue-600' },
    delivered:  { ring: 'ring-emerald-400',bg: 'bg-emerald-500', text: 'text-emerald-600' },
    cancelled:  { ring: 'ring-red-400',    bg: 'bg-red-500',     text: 'text-red-600' },
};

export default function OrderTrackerClient({ slug, orderId, onBack, isDark }: { slug: string, orderId: string, onBack: () => void, isDark: boolean }) {
    const supabase = createCustomerClient();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [shop, setShop] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: shopData } = await supabase
            .from('shops')
            .select('*, primary_color')
            .eq('route_path', slug)
            .single<ShopData>();
        
        if (!shopData) { setLoading(false); return; }
        setShop(shopData);

        const { data: orderData } = await supabase
            .from('orders')
            .select(`*, order_items(quantity, unit_price, ordered_quantity, ordered_unit, selling_unit_value, selling_unit, products(title, image_urls))`)
            .eq('id', orderId)
            .eq('shop_id', shopData.id)
            .eq('customer_auth_id', user.id)
            .single<OrderData>();

        setOrder(orderData);
        setLastRefreshed(new Date());
        setLoading(false);
        if (isRefresh) setRefreshing(false);
    }, [supabase, slug, orderId]);

    useEffect(() => {
        load();
    }, [load]);

    // Auto-poll every 30 seconds
    useEffect(() => {
        pollRef.current = setInterval(() => load(true), 30000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [load]);

    const theme = {
        card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100',
        text: isDark ? 'text-white' : 'text-gray-900',
        textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
        bgSubtle: isDark ? 'bg-gray-800' : 'bg-gray-50',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!shop || !order) {
        return (
            <div className={`p-10 text-center rounded-2xl border ${theme.card}`}>
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className={`text-lg font-bold ${theme.text}`}>Order Not Found</h3>
                <p className={`${theme.textMuted} mb-6`}>We couldn&apos;t load tracking info for this order.</p>
                <button onClick={onBack} className="text-blue-500 font-bold hover:underline">← Back to Orders</button>
            </div>
        );
    }

    const accent = shop.primary_color || '#2563EB';
    const isCancelled = order.status === 'cancelled';
    const stepIndex = STEPS.findIndex(s => s.id === order.status);
    const progress = isCancelled ? 0 : Math.max(0, (stepIndex / (STEPS.length - 1)) * 100);
    const colors = STATUS_COLOR[order.status] || STATUS_COLOR.processing;
    const items = order.order_items || [];

    const statusTimestamps: Record<string, string | undefined> = {
        processing: order.created_at,
        packed:     order.packed_at,
        shipped:    order.shipped_at,
        delivered:  order.delivered_at,
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header controls */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                <button onClick={onBack} className={`flex items-center gap-2 font-bold hover:opacity-70 transition ${theme.text}`}>
                    <ArrowLeft className="w-4 h-4" /> Back to My Orders
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => load(true)} className={`flex items-center gap-1.5 text-xs ${theme.textMuted} hover:${theme.text}`} disabled={refreshing}>
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Auto-refresh
                    </button>
                    <Link href={`/shop/${slug}/invoice/${orderId}`} className="text-xs font-bold border px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition hover:opacity-80" style={{ color: accent, borderColor: accent }}>
                        <Receipt className="w-3.5 h-3.5" /> Invoice
                    </Link>
                </div>
            </div>

            {/* ── ORDER HERO ── */}
            <div className={`rounded-3xl border shadow-sm overflow-hidden ${theme.card}`}>
                <div style={{ backgroundColor: accent }} className="h-1.5 w-full" />
                <div className="p-6 sm:p-10 text-center">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.textMuted}`}>Order Reference</p>
                    <h1 className={`text-4xl font-black mb-1 ${theme.text}`}>#{order.id.split('-')[0].toUpperCase()}</h1>
                    <p className={`text-sm ${theme.textMuted}`}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {isCancelled ? (
                        <div className="mt-6 inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 px-5 py-3 rounded-2xl font-bold text-sm">
                            <AlertCircle className="w-4 h-4" /> This order has been cancelled
                        </div>
                    ) : (
                        <>
                            <div className="mt-12 mb-4 relative px-4">
                                <div className={`absolute top-7 left-[calc(12%+1rem)] right-[calc(12%+1rem)] h-1.5 rounded-full overflow-hidden ${theme.bgSubtle}`}>
                                    <div className="h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${progress}%`, backgroundColor: accent }} />
                                </div>
                                <div className="relative flex justify-between">
                                    {STEPS.map((step, i) => {
                                        const done = !isCancelled && i < stepIndex;
                                        const current = i === stepIndex && !isCancelled;
                                        const pending = i > stepIndex;
                                        const Icon = step.Icon;
                                        const ts = statusTimestamps[step.id];

                                        return (
                                            <div key={step.id} className="flex flex-col items-center flex-1">
                                                <div
                                                    className={`
                                                        w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-sm
                                                        ${current ? `ring-4 ring-offset-2 scale-110 ${colors.ring}` : ''}
                                                        ${done ? 'border-transparent text-white' : `${theme.card}`}
                                                        ${pending ? 'text-gray-300 dark:text-gray-600' : ''}
                                                    `}
                                                    style={done || current ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : {}}
                                                >
                                                    <Icon className={`w-6 h-6 ${current ? 'animate-pulse' : ''}`} />
                                                </div>
                                                <p className={`mt-3 text-sm font-bold ${pending ? 'text-gray-300 dark:text-gray-600' : theme.text}`}>{step.label}</p>
                                                {ts && !pending && (
                                                    <p className={`text-[10px] mt-0.5 ${theme.textMuted}`}>
                                                        {new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ backgroundColor: accent + '18', color: accent }}>
                                {STEPS[stepIndex]?.label === undefined ? 'Processing' : `Status: ${STEPS[stepIndex]?.label}`}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── TRACKING NUMBER CARD ── */}
            {order.tracking_number && (
                <div className={`rounded-2xl border shadow-sm p-6 flex items-start gap-4 ${theme.card}`}>
                    <div style={{ backgroundColor: accent + '18' }} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5" style={{ color: accent }} />
                    </div>
                    <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${theme.text}`}>Shipment Tracking</p>
                        <div className="flex flex-wrap items-center gap-3">
                            {order.tracking_carrier && (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${theme.bgSubtle} ${theme.textMuted}`}>{order.tracking_carrier}</span>
                            )}
                            <span className={`font-mono text-sm font-bold ${theme.text}`}>{order.tracking_number}</span>
                        </div>
                        {order.tracking_url && (
                            <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition"
                                style={{ color: accent, borderColor: accent + '50', backgroundColor: accent + '10' }}
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Track on Carrier Website
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ── CUSTOMER + ORDER DETAILS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-2xl border shadow-sm p-6 ${theme.card}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme.textMuted}`}>Customer</p>
                    <div className="space-y-2">
                        {order.customer_name && (
                            <p className={`font-semibold flex items-center gap-2 ${theme.text}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${theme.bgSubtle} ${theme.textMuted}`}>
                                    {order.customer_name[0]}
                                </span>
                                {order.customer_name}
                            </p>
                        )}
                        {order.customer_email && <p className={`text-sm flex items-center gap-2 ${theme.textMuted}`}><Mail className="w-4 h-4" />{order.customer_email}</p>}
                        {order.customer_phone && <p className={`text-sm flex items-center gap-2 ${theme.textMuted}`}><Phone className="w-4 h-4" />{order.customer_phone}</p>}
                    </div>
                </div>

                <div className={`rounded-2xl border shadow-sm p-6 ${theme.card}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme.textMuted}`}>Delivery Address</p>
                    {order.customer_address ? (
                        <div className={`text-sm space-y-0.5 ${theme.textMuted}`}>
                            <p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}{order.customer_postal ? ` ${order.customer_postal}` : ''}</span>
                            </p>
                        </div>
                    ) : (
                        <p className={`text-sm italic ${theme.textMuted}`}>No address recorded</p>
                    )}
                </div>
            </div>

            {/* ── ORDER ITEMS ── */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${theme.card}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
                    <h2 className={`font-bold ${theme.text}`}>Order Summary</h2>
                </div>
                <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-50'}`}>
                    {items.map((item: OrderItem, i: number) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${theme.bgSubtle}`}>
                                {item.products?.image_urls?.[0] ? (
                                    <img src={item.products.image_urls[0]} alt="Product" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 opacity-30" /></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`font-semibold text-sm ${theme.text}`}>{item.products?.title || 'Product'}</p>
                                <p className={`text-xs ${theme.textMuted}`}>Qty: x{item.quantity} ({formatQuantityLabel(item.ordered_quantity ?? item.quantity, item.ordered_unit ?? item.selling_unit ?? 'item')})</p>
                                <p className={`text-xs ${theme.textMuted}`}>{formatPriceWithUnit(Number(item.unit_price), item.selling_unit ?? item.ordered_unit ?? 'item', item.selling_unit_value ?? 1)}</p>
                            </div>
                            <p className={`font-bold font-mono text-sm ${theme.text}`}>Rs. {Number(item.unit_price * item.quantity).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <div className={`px-6 py-4 border-t flex justify-between items-center ${theme.bgSubtle} ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <span className={`font-bold ${theme.text}`}>Total Paid</span>
                    <span className="text-xl font-black font-mono" style={{ color: accent }}>Rs. {Number(order.total_amount).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
