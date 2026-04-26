'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Receipt, ArrowRight, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { CancelOrderButton } from '@/components/shop/AccountClient';
import OrderTrackerClient from '@/components/shop/OrderTrackerClient';

interface Order {
    id: string;
    total_amount: number;
    status: string;
    invoice_url: string | null;
    created_at: string;
    order_items: { id: string }[];
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    processing: { label: 'Processing', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    shipped: { label: 'Shipped', bg: 'bg-blue-100', text: 'text-blue-700', icon: Truck },
    delivered: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

export default function CustomerOrdersClient({
    initialOrders,
    slug,
    isDark,
    initialTrackOrderId,
}: {
    initialOrders: Order[];
    slug: string;
    isDark: boolean;
    initialTrackOrderId?: string;
}) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [trackOrderId, setTrackOrderId] = useState<string | null>(initialTrackOrderId || null);

    const cardCls = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
    const mutedCls = isDark ? 'text-gray-400' : 'text-gray-500';

    if (trackOrderId) {
        return (
            <OrderTrackerClient 
                slug={slug} 
                orderId={trackOrderId} 
                onBack={() => setTrackOrderId(null)} 
                isDark={isDark} 
            />
        );
    }

    return (
        <div className="space-y-4">
            {orders.map(order => {
                const cfg = STATUS_CFG[order.status] || STATUS_CFG.processing;
                const StatusIcon = cfg.icon;
                const canCancel = order.status === 'processing';

                return (
                    <div
                        key={order.id}
                        className={`p-5 rounded-2xl border shadow-sm transition hover:shadow-md ${cardCls} ${order.status === 'cancelled' ? 'opacity-60' : ''}`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Order info */}
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="font-bold text-base">
                                        Order #{order.id.split('-')[0].toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {cfg.label}
                                    </span>
                                </div>
                                <p className={`text-xs ${mutedCls}`}>
                                    Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                <p className={`text-sm ${mutedCls}`}>
                                    {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''} •{' '}
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        Rs. {Number(order.total_amount).toLocaleString()}
                                    </span>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                {/* Cancel — only if processing */}
                                {canCancel && (
                                    <CancelOrderButton
                                        orderId={order.id}
                                        onCancelled={() =>
                                            setOrders(prev =>
                                                prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o)
                                            )
                                        }
                                    />
                                )}

                                {/* Invoice link */}
                                {order.invoice_url && (
                                    <Link
                                        href={order.invoice_url}
                                        target="_blank"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${cardCls} ${mutedCls} hover:opacity-80 transition`}
                                    >
                                        <Receipt className="w-3.5 h-3.5" />
                                        Invoice
                                    </Link>
                                )}

                                {/* Track */}
                                {order.status !== 'cancelled' && (
                                    <button
                                        onClick={() => setTrackOrderId(order.id)}
                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                                    >
                                        Track Order
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
