import Link from 'next/link';
import { CheckCircle2, ArrowRight, Receipt } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

interface SuccessPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ orderId?: string }>;
}

interface ShopRecord {
    id: string;
    route_path: string;
    shop_name: string;
}

interface OrderRecord {
    id: string;
    customer_name: string | null;
    total_amount: number | null;
    payment_method: string | null;
}

export default async function CheckoutSuccessPage({ params, searchParams }: SuccessPageProps) {
    const { slug } = await params;
    const { orderId } = await searchParams;

    const supabase = await createClient();

    const { data: shop } = await supabase
        .from('shops')
        .select('id, route_path, shop_name')
        .eq('route_path', slug)
        .maybeSingle<ShopRecord>();

    if (!shop) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Store not found</h1>
                    <p className="text-gray-500 mb-6">We couldn&apos;t load your checkout success details.</p>
                    <Link href="/" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    let order: OrderRecord | null = null;

    if (orderId) {
        const { data: orderData } = await supabase
            .from('orders')
            .select('id, customer_name, total_amount, payment_method')
            .eq('id', orderId)
            .eq('shop_id', shop.id)
            .maybeSingle<OrderRecord>();

        order = orderData;
    }

    const amount = order?.total_amount ?? 0;
    const reference = order?.id ? `#${order.id.split('-')[0].toUpperCase()}` : 'Processing';

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="h-1.5 bg-emerald-500 w-full" />
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 text-center">Payment successful</h1>
                    <p className="text-center text-gray-500 mt-2 mb-8">Your order has been placed successfully.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-8">
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                            <p className="text-gray-400 font-semibold mb-1">Order Number</p>
                            <p className="text-gray-900 font-bold">{reference}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                            <p className="text-gray-400 font-semibold mb-1">Customer</p>
                            <p className="text-gray-900 font-bold">{order?.customer_name || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                            <p className="text-gray-400 font-semibold mb-1">Total Amount</p>
                            <p className="text-gray-900 font-bold">Rs. {amount.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                            <p className="text-gray-400 font-semibold mb-1">Payment Method</p>
                            <p className="text-gray-900 font-bold uppercase">{order?.payment_method || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href={`/shop/${shop.route_path}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition"
                        >
                            Continue Shopping
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        {order?.id && (
                            <Link
                                href={`/shop/${shop.route_path}/order/${order.id}`}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition"
                            >
                                <Receipt className="w-4 h-4" />
                                View Order
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
