import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { MapPin, Phone, Mail, FileText, Truck } from 'lucide-react';
import Link from 'next/link';
import PrintButton from './PrintButton';

export const revalidate = 0;

interface ShopInvoiceView {
    id: string;
    shop_name: string;
    logo_url: string | null;
    company_address: string | null;
    invoice_notes: string | null;
    tax_rate: number | null;
    primary_color: string | null;
    route_path: string;
}

interface InvoiceOrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products: {
        title: string | null;
        image_urls: string[] | null;
    } | null;
}

interface InvoiceOrder {
    id: string;
    created_at: string;
    status: string;
    total_amount: number | null;
    payment_method: string | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    customer_address: string | null;
    customer_city: string | null;
    customer_postal: string | null;
    tracking_number: string | null;
    tracking_carrier: string | null;
    tracking_url: string | null;
    order_items: InvoiceOrderItem[];
}

export default async function InvoicePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const { slug, id } = await params;
    const supabase = await createClient();

    // 1. Fetch Shop
    const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_name, logo_url, company_address, invoice_notes, tax_rate, primary_color, route_path')
        .eq('route_path', slug)
        .maybeSingle<ShopInvoiceView>();

    if (shopError || !shop) notFound();

    // 2. Fetch Order + Items
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id, product_id, quantity, unit_price,
                products ( title, image_urls )
            )
        `)
        .eq('id', id)
        .eq('shop_id', shop.id)
        .maybeSingle<InvoiceOrder>();

    if (orderError || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                <p className="text-gray-500 mb-6 text-center max-w-sm">This invoice does not exist or has been removed.</p>
                <Link href={`/shop/${slug}`} className="text-blue-600 font-medium hover:underline">Return to Shop</Link>
            </div>
        );
    }

    // Financial Calculations
    const items = order.order_items || [];
    const subtotal = items.reduce((s: number, item: InvoiceOrderItem) => {
        const lineTotal = item.unit_price * item.quantity;
        return s + Number(lineTotal);
    }, 0);
    const taxRate = Number(shop.tax_rate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = Number(order.total_amount) || subtotal + taxAmount;

    const invoiceNumber = `INV-${order.id.split('-')[0].toUpperCase()}`;
    const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const accentColor = shop.primary_color || '#2563EB';

    const STATUS_LABELS: Record<string, { label: string; color: string }> = {
        processing: { label: 'Processing', color: '#F59E0B' },
        packed:     { label: 'Packed', color: '#6366F1' },
        shipped:    { label: 'Shipped', color: '#3B82F6' },
        delivered:  { label: 'Delivered', color: '#10B981' },
        cancelled:  { label: 'Cancelled', color: '#EF4444' },
    };
    const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.processing;

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Action Bar */}
                <div className="mb-6 flex justify-between items-center hide-on-print print:hidden">
                    <Link href={`/shop/${slug}/order/${id}`} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 transition">
                        ← Back to Order Tracker
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/shop/${slug}`}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 bg-white px-4 py-2 rounded-xl transition"
                        >
                            Continue Shopping
                        </Link>
                        <PrintButton />
                    </div>
                </div>

                {/* Invoice Card */}
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">

                    {/* ── TOP ACCENT BAR ── */}
                    <div style={{ backgroundColor: accentColor }} className="h-2 w-full" />

                    {/* ── HEADER ── */}
                    <div className="px-10 py-8 sm:py-10 flex flex-col sm:flex-row justify-between items-start gap-8 border-b border-gray-100">
                        {/* Shop Identity */}
                        <div>
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.shop_name} className="h-14 w-auto object-contain mb-5" />
                            ) : (
                                <div className="flex items-center gap-3 mb-5">
                                    <div style={{ backgroundColor: accentColor }} className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-xl">
                                        {shop.shop_name[0].toUpperCase()}
                                    </div>
                                    <h1 className="text-2xl font-extrabold text-gray-900">{shop.shop_name}</h1>
                                </div>
                            )}
                            {shop.company_address && (
                                <div className="text-sm text-gray-500 flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <p className="whitespace-pre-line leading-relaxed">{shop.company_address}</p>
                                </div>
                            )}
                        </div>

                        {/* Invoice Meta */}
                        <div className="sm:text-right">
                            <p className="text-5xl font-black tracking-tight" style={{ color: accentColor }}>INVOICE</p>
                            <div className="mt-4 space-y-1.5 text-sm">
                                <div className="flex sm:justify-end items-center gap-2">
                                    <span className="text-gray-400 font-medium">Invoice No.</span>
                                    <span className="font-mono font-bold text-gray-800">{invoiceNumber}</span>
                                </div>
                                <div className="flex sm:justify-end items-center gap-2">
                                    <span className="text-gray-400 font-medium">Date</span>
                                    <span className="font-semibold text-gray-700">{orderDate}</span>
                                </div>
                                <div className="flex sm:justify-end items-center gap-2">
                                    <span className="text-gray-400 font-medium">Status</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: statusInfo.color }}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── BILL TO / SHIP TO ── */}
                    <div className="px-10 py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                            <p className="font-bold text-gray-900">{order.customer_name || '—'}</p>
                            <div className="mt-1.5 space-y-1 text-sm text-gray-500">
                                {order.customer_email && (
                                    <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {order.customer_email}</p>
                                )}
                                {order.customer_phone && (
                                    <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {order.customer_phone}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ship To</p>
                            {order.customer_address ? (
                                <div className="text-sm text-gray-600 space-y-0.5">
                                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                                    <p>{order.customer_address}</p>
                                    {order.customer_city && <p>{order.customer_city}{order.customer_postal ? ` — ${order.customer_postal}` : ''}</p>}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No address on file</p>
                            )}
                        </div>
                    </div>

                    {/* ── TRACKING INFO (if available) ── */}
                    {order.tracking_number && (
                        <div className="px-10 py-4 border-b border-gray-100 bg-blue-50/40 flex flex-wrap items-center gap-4">
                            <Truck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div className="flex items-center gap-3 flex-wrap text-sm">
                                <span className="font-semibold text-gray-600">Tracking:</span>
                                <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                                    {order.tracking_carrier && `${order.tracking_carrier} — `}{order.tracking_number}
                                </span>
                                {order.tracking_url && (
                                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                                        className="text-blue-600 underline text-xs font-semibold hover:text-blue-800 transition">
                                        Track Shipment →
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── LINE ITEMS ── */}
                    <div className="px-10 py-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ borderBottomColor: accentColor }} className="border-b-2">
                                    <th className="pb-3 text-xs uppercase tracking-widest text-gray-400 font-semibold">Description</th>
                                    <th className="pb-3 text-xs uppercase tracking-widest text-gray-400 font-semibold text-center w-20">Qty</th>
                                    <th className="pb-3 text-xs uppercase tracking-widest text-gray-400 font-semibold text-right w-32">Unit Price</th>
                                    <th className="pb-3 text-xs uppercase tracking-widest text-gray-400 font-semibold text-right w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-gray-400 italic">No line items recorded</td>
                                    </tr>
                                ) : items.map((item: InvoiceOrderItem) => {
                                    const lineTotal = item.unit_price * item.quantity;
                                    return (
                                        <tr key={item.id} className="text-gray-700 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-3">
                                                    {item.products?.image_urls?.[0] && (
                                                        <img
                                                            src={item.products.image_urls[0]}
                                                            alt={item.products?.title || 'Product'}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 print:hidden"
                                                        />
                                                    )}
                                                    <p className="font-semibold text-gray-900">{item.products?.title || 'Product'}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center font-mono text-gray-500">{item.quantity}</td>
                                            <td className="py-4 text-right font-mono text-gray-500">Rs. {Number(item.unit_price).toFixed(2)}</td>
                                            <td className="py-4 text-right font-mono font-bold text-gray-900">Rs. {Number(lineTotal).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="mt-8 flex justify-end">
                            <div className="w-full sm:w-72 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500 py-1.5">
                                    <span>Subtotal</span>
                                    <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
                                </div>
                                {taxRate > 0 && (
                                    <div className="flex justify-between text-gray-500 py-1.5">
                                        <span>Tax ({taxRate}%)</span>
                                        <span className="font-mono">Rs. {taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {order.payment_method && (
                                    <div className="flex justify-between text-gray-400 py-1.5">
                                        <span>Payment</span>
                                        <span className="capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-4 border-t-2" style={{ borderColor: accentColor }}>
                                    <span className="text-lg font-extrabold text-gray-900">Total</span>
                                    <span className="font-black text-xl font-mono" style={{ color: accentColor }}>Rs. {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="px-10 py-8 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            {shop.invoice_notes && (
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Notes & Terms</p>
                                    <p className="text-gray-500 whitespace-pre-line leading-relaxed">{shop.invoice_notes}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Tracker</p>
                                <p className="text-gray-500 text-xs leading-relaxed mb-2">
                                    Track the live status of your order at any time:
                                </p>
                                <a
                                    href={`/shop/${slug}/order/${id}`}
                                    className="text-xs font-mono underline break-all"
                                    style={{ color: accentColor }}
                                >
                                    {`/shop/${slug}/order/${id}`}
                                </a>
                            </div>
                        </div>

                        {/* Payment Status strip */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                            <p className="text-xs text-gray-400">
                                Thank you for ordering from <span className="font-bold text-gray-600">{shop.shop_name}</span>.
                            </p>
                            <p className="text-xs text-gray-300">Powered by MyShop Platform • Auto-generated invoice</p>
                        </div>
                    </div>

                    {/* ── BOTTOM ACCENT BAR ── */}
                    <div style={{ backgroundColor: accentColor }} className="h-1.5 w-full opacity-40" />
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { background-color: white !important; margin: 0; }
                    .print\\:hidden { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { margin: 10mm; }
                }
            ` }} />
        </div>
    );
}
