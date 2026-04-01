import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Store, MapPin, Phone, Mail, FileText, Download } from 'lucide-react';
import Link from 'next/link';

import PrintButton from './PrintButton';

export default async function InvoicePage({ params }: { params: { slug: string, id: string } }) {
    const supabase = await createClient();

    // 1. Fetch Shop Details & Invoice Settings
    const { data: shop } = await supabase
        .from('shops')
        .select('id, shop_name, logo_url, company_address, invoice_notes, tax_rate')
        .eq('route_path', params.slug)
        .single();

    if (!shop) {
        notFound();
    }

    // 2. Fetch Order Details & Items
    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id, product_id, quantity, unit_price, total_price,
                products ( title )
            )
        `)
        .eq('id', params.id)
        .eq('shop_id', shop.id)
        .single();

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                <p className="text-gray-500 mb-6 text-center max-w-sm">The invoice you are looking for does not exist or you don't have permission to view it.</p>
                <Link href={`/shop/${params.slug}`} className="text-blue-600 font-medium hover:underline">
                    Return to Shop
                </Link>
            </div>
        );
    }

    // Financial Calculations
    let subtotal = 0;
    order.order_items.forEach((item: any) => {
        subtotal += item.total_price;
    });

    const taxAmount = shop.tax_rate ? (subtotal * (shop.tax_rate / 100)) : 0;
    // Assuming total_amount already includes tax if tax was implemented at checkout. 
    // If not, we might append it. For this display, we'll assume total_amount on order is the Grand Total.
    const grandTotal = order.total_amount;

    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Action Bar */}
                <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm hide-on-print border border-gray-200">
                    <Link href={`/dashboard/orders`} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        &larr; Back to Orders
                    </Link>
                    <PrintButton />
                </div>

                {/* Printable Invoice Container */}
                <div className="bg-white shadow-xl rounded-none sm:rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

                    {/* Invoice Header */}
                    <div className="p-8 sm:p-12 border-b-8 border-blue-600 bg-gray-50 flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div>
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.shop_name} className="h-16 w-auto object-contain mb-4" />
                            ) : (
                                <div className="flex items-center gap-3 mb-4 text-blue-600">
                                    <Store className="w-10 h-10" />
                                    <h1 className="text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
                                </div>
                            )}

                            <div className="text-sm text-gray-500 space-y-1">
                                {shop.company_address ? (
                                    <p className="whitespace-pre-line flex items-start gap-2 max-w-xs">
                                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{shop.company_address}</span>
                                    </p>
                                ) : (
                                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> No address configured.</p>
                                )}
                            </div>
                        </div>

                        <div className="text-left sm:text-right">
                            <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest mb-2">INVOICE</h2>
                            <p className="text-gray-900 font-semibold mb-1">Invoice #: <span className="font-mono text-gray-600">{order.id.split('-')[0].toUpperCase()}</span></p>
                            <p className="text-gray-500 text-sm">Date: {orderDate}</p>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Bill To</p>
                                <p className="text-gray-900 font-medium flex items-center sm:justify-end gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" /> {order.customer_email}
                                </p>
                                {order.customer_phone && (
                                    <p className="text-gray-600 text-sm flex items-center sm:justify-end gap-2 mt-1">
                                        <Phone className="w-4 h-4 text-gray-400" /> {order.customer_phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Body - Items */}
                    <div className="p-8 sm:p-12">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-900 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="py-3 px-2 font-semibold">Description</th>
                                    <th className="py-3 px-2 font-semibold text-center w-24">QTY</th>
                                    <th className="py-3 px-2 font-semibold text-right w-32">Unit Price</th>
                                    <th className="py-3 px-2 font-semibold text-right w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.order_items.map((item: any) => (
                                    <tr key={item.id} className="text-gray-700">
                                        <td className="py-4 px-2 font-medium">
                                            {item.products?.title || 'Unknown Product'}
                                        </td>
                                        <td className="py-4 px-2 text-center text-gray-500 font-mono">
                                            {item.quantity}
                                        </td>
                                        <td className="py-4 px-2 text-right font-mono text-gray-500">
                                            Rs. {item.unit_price.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-2 text-right font-mono font-medium text-gray-900">
                                            Rs. {item.total_price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-full sm:w-80 space-y-3 text-sm">
                                <div className="flex justify-between text-gray-500 py-1">
                                    <span>Subtotal</span>
                                    <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
                                </div>
                                {shop.tax_rate > 0 && (
                                    <div className="flex justify-between text-gray-500 py-1">
                                        <span>Tax ({shop.tax_rate}%)</span>
                                        <span className="font-mono">Rs. {taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-4 border-t-2 border-gray-900 text-lg font-bold">
                                    <span className="text-gray-900">Total Due</span>
                                    <span className="font-mono text-blue-600">Rs. {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Footer */}
                    <div className="bg-gray-50 p-8 sm:p-12 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Payment/Order Status</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block border ${order.status === 'Processing' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {shop.invoice_notes && (
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                                    <p className="text-gray-500 whitespace-pre-line leading-relaxed">
                                        {shop.invoice_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 text-center text-xs text-gray-400 pb-4">
                            Powered by eShop • Invoice automatically generated.
                        </div>
                    </div>

                </div>

                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body { background-color: white !important; }
                        .hide-on-print { display: none !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                `}} />
            </div>
        </div>
    );
}
