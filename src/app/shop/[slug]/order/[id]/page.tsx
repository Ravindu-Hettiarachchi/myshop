'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createCustomerClient } from '@/utils/supabase/customer-client';
import { Package, Truck, CheckCircle, Store, Receipt, Clock, Box, MapPin, Mail, Phone, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
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

export default function OrderTrackerPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const supabase = createCustomerClient();
    const [order, setOrder] = useState<OrderData | null>(null);
    const [shop, setShop] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [slug, setSlug] = useState('');
    const [orderId, setOrderId] = useState('');
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = useCallback(async (s: string, id: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = `/shop/${s}/login?next=${encodeURIComponent(`/shop/${s}/order/${id}`)}`;
            return;
        }

        const { data: shopData } = await supabase
            .from('shops')
            .select('*, primary_color')
            .eq('route_path', s)
            .single<ShopData>();
        if (!shopData) { setLoading(false); return; }
        setShop(shopData);

        const { data: shopCustomer } = await supabase
            .from('shop_customers')
            .select('id')
            .eq('shop_id', shopData.id)
            .eq('auth_user_id', user.id)
            .maybeSingle<{ id: string }>();

        if (!shopCustomer?.id) {
            window.location.href = `/shop/${s}`;
            return;
        }

        const { data: orderData } = await supabase
            .from('orders')
            .select(`*, order_items(quantity, unit_price, ordered_quantity, ordered_unit, selling_unit_value, selling_unit, products(title, image_urls))`)
            .eq('id', id)
            .eq('shop_id', shopData.id)
            .eq('customer_auth_id', user.id)
            .single<OrderData>();

        setOrder(orderData);
        setLastRefreshed(new Date());
        setLoading(false);
        if (isRefresh) setRefreshing(false);
    }, [supabase]);

    useEffect(() => {
        params.then(({ slug, id }) => {
            setSlug(slug);
            setOrderId(id);
            load(slug, id);
        });
    }, [params, load]);

    // Auto-poll every 30 seconds
    useEffect(() => {
        if (!slug || !orderId) return;
        pollRef.current = setInterval(() => load(slug, orderId, true), 30000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [slug, orderId, load]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm font-medium">Loading your order...</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return <div className="min-h-screen flex items-center justify-center text-gray-600">Shop not found.</div>;
    }

    const accent = shop.primary_color || '#2563EB';

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                <p className="text-gray-500 max-w-sm mb-6">We couldn&apos;t find tracking info for this order.</p>
                <Link href={`/shop/${slug}`} className="text-blue-600 font-medium hover:underline">Return to {shop.shop_name}</Link>
            </div>
        );
    }

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
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* ── TOP NAV ── */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                    <Link href={`/shop/${slug}`} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition">
                        {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name} className="h-7 w-auto object-contain" />
                        ) : (
                            <div style={{ backgroundColor: accent }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm">
                                {shop.shop_name[0]}
                            </div>
                        )}
                        <span>{shop.shop_name}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => load(slug, orderId, true)}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
                            disabled={refreshing}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Auto-refresh</span>
                        </button>
                        <Link
                            href={`/shop/${slug}/invoice/${orderId}`}
                            className="flex items-center gap-1.5 text-sm font-semibold border rounded-xl px-3 py-1.5 transition"
                            style={{ borderColor: accent, color: accent }}
                        >
                            <Receipt className="w-4 h-4" />
                            <span className="hidden sm:inline">Invoice</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── ORDER HERO ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Accent top */}
                    <div style={{ backgroundColor: accent }} className="h-1.5 w-full" />

                    <div className="p-8 sm:p-10 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Reference</p>
                        <h1 className="text-4xl font-black text-gray-900 mb-1">#{order.id.split('-')[0].toUpperCase()}</h1>
                        <p className="text-sm text-gray-400">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>

                        {isCancelled && (
                            <div className="mt-6 inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 px-5 py-3 rounded-2xl font-bold text-sm">
                                <AlertCircle className="w-4 h-4" /> This order has been cancelled
                            </div>
                        )}

                        {!isCancelled && (
                            <>
                                {/* ── PROGRESS BAR ── */}
                                <div className="mt-12 mb-4 relative px-4">
                                    {/* Track */}
                                    <div className="absolute top-7 left-[calc(12%+1rem)] right-[calc(12%+1rem)] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-in-out"
                                            style={{ width: `${progress}%`, backgroundColor: accent }}
                                        />
                                    </div>

                                    {/* Steps */}
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
                                                            ${done ? 'border-transparent text-white' : 'border-gray-200 bg-white'}
                                                            ${pending ? 'text-gray-300' : ''}
                                                        `}
                                                        style={done || current ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : {}}
                                                    >
                                                        <Icon className={`w-6 h-6 ${current ? 'animate-pulse' : ''}`} />
                                                    </div>
                                                    <p className={`mt-3 text-sm font-bold ${pending ? 'text-gray-300' : 'text-gray-700'}`}>{step.label}</p>
                                                    {ts && !pending && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Current Status message */}
                                <div className="mt-8 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ backgroundColor: accent + '18', color: accent }}>
                                    {STEPS[stepIndex]?.label === undefined ? 'Processing' : `Status: ${STEPS[stepIndex]?.label}`}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── TRACKING NUMBER CARD ── */}
                {order.tracking_number && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                        <div style={{ backgroundColor: accent + '18' }} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Truck className="w-5 h-5" style={{ color: accent }} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm mb-1">Shipment Tracking</p>
                            <div className="flex flex-wrap items-center gap-3">
                                {order.tracking_carrier && (
                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{order.tracking_carrier}</span>
                                )}
                                <span className="font-mono text-sm font-bold text-gray-800">{order.tracking_number}</span>
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
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer</p>
                        <div className="space-y-2">
                            {order.customer_name && (
                                <p className="font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-bold">
                                        {order.customer_name[0]}
                                    </span>
                                    {order.customer_name}
                                </p>
                            )}
                            {order.customer_email && <p className="text-sm text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{order.customer_email}</p>}
                            {order.customer_phone && <p className="text-sm text-gray-500 flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{order.customer_phone}</p>}
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Address</p>
                        {order.customer_address ? (
                            <div className="text-sm text-gray-600 space-y-0.5">
                                <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}{order.customer_postal ? ` ${order.customer_postal}` : ''}</span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No address recorded</p>
                        )}
                    </div>
                </div>

                {/* ── ORDER ITEMS ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">Order Summary</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map((item: OrderItem, i: number) => (
                            <div key={i} className="px-6 py-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                    {item.products?.image_urls?.[0] ? (
                                        <img
                                            src={item.products.image_urls[0]}
                                            alt={item.products?.title || 'Product'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-5 h-5 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{item.products?.title || 'Product'}</p>
                                    <p className="text-xs text-gray-400">
                                        Qty: x{item.quantity} ({formatQuantityLabel(item.ordered_quantity ?? item.quantity, item.ordered_unit ?? item.selling_unit ?? 'item')})
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {formatPriceWithUnit(Number(item.unit_price), item.selling_unit ?? item.ordered_unit ?? 'item', item.selling_unit_value ?? 1)}
                                    </p>
                                </div>
                                <p className="font-bold text-gray-900 font-mono text-sm">
                                    Rs. {Number(item.unit_price * item.quantity).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Paid</span>
                        <span className="text-xl font-black font-mono" style={{ color: accent }}>
                            Rs. {Number(order.total_amount).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* ── FOOTER CTA ── */}
                <div className="flex flex-col sm:flex-row gap-3 pb-4">
                    <Link
                        href={`/shop/${slug}/invoice/${orderId}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition text-white"
                        style={{ backgroundColor: accent, borderColor: accent }}
                    >
                        <Receipt className="w-4 h-4" /> Download Invoice
                    </Link>
                    <Link
                        href={`/shop/${slug}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Store className="w-4 h-4" /> Continue Shopping
                    </Link>
                </div>

                {/* Auto-refresh note */}
                <p className="text-center text-xs text-gray-300 pb-4">
                    Status auto-refreshes every 30s · Last updated: {lastRefreshed.toLocaleTimeString()}
                </p>

            </div>
        </div>
    );
}
