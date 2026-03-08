import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Store, Receipt } from 'lucide-react';

export const revalidate = 0; // Fresh fetch for accurate order status

export default async function OrderStatusPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
    const { slug, id } = await params;
    const supabase = await createClient();

    // 1. Verify Shop
    const { data: shop } = await supabase.from('shops').select('*').eq('route_path', slug).single();
    if (!shop) return <div className="p-8 text-center">Store not found</div>;

    // 2. Fetch Order with Items and Products
    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity,
                unit_price,
                products ( title, image_urls )
            )
        `)
        .eq('id', id)
        .eq('shop_id', shop.id)
        .single();

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
                    <p className="text-gray-500 mb-6">We couldn't locate tracking information for order #{id.split('-')[0]}</p>
                    <Link href={`/shop/${slug}`} className="text-blue-600 hover:underline">
                        Return to {shop.shop_name}
                    </Link>
                </div>
            </div>
        );
    }

    const tStyles = {
        bg: shop.template === 'modern-dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900',
        card: shop.template === 'modern-dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100',
        border: shop.template === 'modern-dark' ? 'border-gray-800' : 'border-gray-100',
        textMuted: shop.template === 'modern-dark' ? 'text-gray-400' : 'text-gray-500',
    };

    const statusSteps = [
        { id: 'processing', label: 'Processing', icon: Package },
        { id: 'shipped', label: 'Shipped', icon: Truck },
        { id: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.id === order.status);

    return (
        <div className={`min-h-screen ${tStyles.bg} py-12 px-4 sm:px-6 lg:px-8 font-sans`}>
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href={`/shop/${slug}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition">
                        <Store className="w-5 h-5" />
                        <span className="font-medium">Back to {shop.shop_name}</span>
                    </Link>
                    {order.invoice_url && (
                        <Link href={order.invoice_url} target="_blank" className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition">
                            <Receipt className="w-4 h-4" />
                            Download Invoice
                        </Link>
                    )}
                </div>

                {/* Status Hero */}
                <div className={`${tStyles.card} rounded-3xl p-8 border text-center shadow-sm`}>
                    <h1 className="text-3xl font-extrabold mb-2">Order #{order.id.split('-')[0].toUpperCase()}</h1>
                    <p className={`${tStyles.textMuted}`}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>

                    {/* Progress Tracker Tracker */}
                    <div className="mt-12 mb-4 relative">
                        <div className={`absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 rounded-full overflow-hidden`}>
                            <div
                                className="h-full bg-blue-600 transition-all duration-1000"
                                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                            />
                        </div>

                        <div className="relative flex justify-between z-10">
                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} className="flex flex-col items-center">
                                        <div className={`
                                            w-14 h-14 rounded-full flex items-center justify-center border-4 ${tStyles.card} shadow-sm transition-colors duration-500
                                            ${isCompleted ? 'bg-blue-600 text-white border-blue-100 dark:border-blue-900' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}
                                            ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110' : ''}
                                        `}>
                                            <Icon className={`w-6 h-6 ${isCurrent && !isCompleted ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <span className={`mt-4 font-bold text-sm ${isCompleted ? '' : tStyles.textMuted}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Order Details & Items */}
                <div className={`${tStyles.card} rounded-3xl p-8 border shadow-sm`}>
                    <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                    <div className="space-y-6">
                        {order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className={`flex items-center gap-4 pb-6 ${idx !== order.order_items.length - 1 ? 'border-b' : ''} ${tStyles.border}`}>
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img
                                        src={item.products?.image_urls?.[0] || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80'}
                                        alt={item.products?.title || 'Product'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold">{item.products?.title || 'Unknown Product'}</h4>
                                    <p className={`text-sm ${tStyles.textMuted}`}>Qty: {item.quantity}</p>
                                </div>
                                <div className="font-bold">
                                    රු {(item.unit_price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Breakdown */}
                    <div className={`mt-6 pt-6 border-t font-mono text-sm ${tStyles.border} space-y-3`}>
                        <div className="flex justify-between items-center text-gray-500">
                            <span>Subtotal</span>
                            <span>රු {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-500">
                            <span>Tax (Local)</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold font-sans mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <span>Total Paid</span>
                            <span className="text-blue-600">රු {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
