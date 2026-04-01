import Link from 'next/link';
import { createCustomerServerClient } from '@/utils/supabase/customer-server';
import { redirect } from 'next/navigation';
import { Package, Truck, CheckCircle, Clock, Receipt, ExternalLink } from 'lucide-react';
import { formatQuantityLabel } from '@/lib/products';
import { hasShopCustomerLink } from '@/lib/auth/context';

interface OrdersPageProps {
    params: Promise<{ slug: string }>;
}

interface CustomerOrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    ordered_quantity: number | null;
    ordered_unit: string | null;
    products: {
        title: string | null;
        image_urls: string[] | null;
    } | null;
}

interface CustomerOrder {
    id: string;
    created_at: string;
    delivered_at: string | null;
    total_amount: number;
    payment_method: string | null;
    status: string;
    tracking_number: string | null;
    tracking_carrier: string | null;
    tracking_url: string | null;
    order_items: CustomerOrderItem[];
}

const ACTIVE_STATUSES = new Set(['processing', 'packed', 'shipped']);

const STATUS_STYLE: Record<string, string> = {
    processing: 'bg-amber-100 text-amber-700',
    packed: 'bg-violet-100 text-violet-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

function OrderItemRow({ item }: { item: CustomerOrderItem }) {
    const image = item.products?.image_urls?.[0] || null;
    const itemSubtotal = Number(item.unit_price || 0) * Number(item.quantity || 0);
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                {image ? (
                    <img src={image} alt={item.products?.title || 'Product'} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-semibold">N/A</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.products?.title || 'Product'}</p>
                <p className="text-xs text-gray-500">
                    Qty: x{item.quantity} ({formatQuantityLabel(item.ordered_quantity ?? item.quantity, item.ordered_unit ?? 'item')})
                </p>
            </div>
            <p className="text-xs font-semibold text-gray-700">Rs. {itemSubtotal.toLocaleString()}</p>
        </div>
    );
}

function OrderCard({ order, slug, isDelivered }: { order: CustomerOrder; slug: string; isDelivered: boolean }) {
    const statusClass = STATUS_STYLE[order.status] || STATUS_STYLE.processing;
    const statusLabel = STATUS_LABEL[order.status] || order.status;
    const deliveredDate = order.delivered_at
        ? new Date(order.delivered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order</p>
                    <h3 className="font-bold text-gray-900">#{order.id.split('-')[0].toUpperCase()}</h3>
                    <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                {order.order_items.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No item details available.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {order.order_items.map((item) => <OrderItemRow key={item.id} item={item} />)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                    <p className="text-gray-400 text-xs">Total</p>
                    <p className="font-semibold text-gray-900">Rs. {Number(order.total_amount).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">Payment</p>
                    <p className="font-semibold text-gray-900 uppercase">{order.payment_method || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-xs">Tracking</p>
                    {order.tracking_number ? (
                        <p className="font-semibold text-gray-900">{order.tracking_carrier ? `${order.tracking_carrier} · ` : ''}{order.tracking_number}</p>
                    ) : (
                        <p className="text-gray-500">Pending</p>
                    )}
                </div>
            </div>

            {isDelivered && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 font-medium">
                    {deliveredDate ? `Delivered on ${deliveredDate}` : 'Delivered'}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                {!isDelivered && ACTIVE_STATUSES.has(order.status) && (
                    <Link href={`/shop/${slug}/order/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition">
                        <Truck className="w-3.5 h-3.5" />
                        Track Order
                    </Link>
                )}
                <Link href={`/shop/${slug}/invoice/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition">
                    <Receipt className="w-3.5 h-3.5" />
                    Invoice
                </Link>
                {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Carrier Link
                    </a>
                )}
            </div>
        </div>
    );
}

export default async function CustomerOrdersPage({ params }: OrdersPageProps) {
    const { slug } = await params;
    const supabase = await createCustomerServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/shop/${slug}/login?next=${encodeURIComponent(`/shop/${slug}/orders`)}`);
    }

    const { data: shop } = await supabase
        .from('shops')
        .select('id, shop_name, route_path')
        .eq('route_path', slug)
        .maybeSingle<{ id: string; shop_name: string; route_path: string }>();

    if (!shop) {
        return <div className="p-8 text-center">Store not found</div>;
    }

    const isShopCustomer = await hasShopCustomerLink(supabase, {
        shopId: shop.id,
        userId: user.id,
    });

    if (!isShopCustomer) {
        redirect(`/shop/${slug}`);
    }

    const orderSelect = 'id, created_at, delivered_at, total_amount, payment_method, status, tracking_number, tracking_carrier, tracking_url, order_items(id, quantity, unit_price, ordered_quantity, ordered_unit, products(title, image_urls))';

    const { data: authLinkedOrders } = await supabase
        .from('orders')
        .select(orderSelect)
        .eq('shop_id', shop.id)
        .eq('customer_auth_id', user.id)
        .order('created_at', { ascending: false })
        .returns<CustomerOrder[]>();

    const allOrders = authLinkedOrders || [];

    const activeOrders = allOrders.filter((o) => ACTIVE_STATUSES.has(o.status));
    const deliveredOrders = allOrders.filter((o) => o.status === 'delivered');

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">My Orders</h1>
                        <p className="text-sm text-gray-500">Track active deliveries and view your completed orders for {shop.shop_name}.</p>
                    </div>
                    <Link href={`/shop/${slug}`} className="text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-white transition">
                        Continue Shopping
                    </Link>
                </div>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" /> Active / Not Delivered
                    </h2>
                    {activeOrders.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-500">No active orders right now.</div>
                    ) : (
                        activeOrders.map((order) => <OrderCard key={order.id} order={order} slug={slug} isDelivered={false} />)
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" /> Delivered
                    </h2>
                    {deliveredOrders.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-500">No delivered orders yet.</div>
                    ) : (
                        deliveredOrders.map((order) => <OrderCard key={order.id} order={order} slug={slug} isDelivered />)
                    )}
                </section>

                {allOrders.length === 0 && (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
                        <Link href={`/shop/${slug}`} className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition">
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
