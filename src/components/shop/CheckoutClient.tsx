'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomerClient } from '@/utils/supabase/customer-client';
import { Loader2, ArrowLeft, CreditCard, Wallet, MapPin, Truck, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { formatPriceWithUnit, formatQuantityLabel, type ProductUnit } from '@/lib/products';

interface CartItem {
    id: string;
    title: string;
    price: number;
    image?: string;
    quantityMultiplier: number;
    orderedQuantity: number;
    orderedUnit: ProductUnit;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    stock_unit: ProductUnit;
}
interface ShopData {
    id: string;
    route_path: string;
    tax_rate: number | string | null;
    template: string | null;
}

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
        </p>
    );
}

type Fields = 'fullName' | 'address' | 'city' | 'postalCode';

export default function CheckoutClient({ shop }: { shop: ShopData }) {
    const router = useRouter();
    const supabase = createCustomerClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerEmail, setCustomerEmail] = useState('');
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');

    const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});
    const [orderError, setOrderError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

    useEffect(() => {
        const savedCart = localStorage.getItem(`myshop_cart_${shop.id}`);
        if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch { } }

        const savedDraft = localStorage.getItem(`myshop_checkout_draft_${shop.id}`);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft) as {
                    fullName?: string;
                    address?: string;
                    city?: string;
                    postalCode?: string;
                    paymentMethod?: 'card' | 'cod';
                };
                setFullName(draft.fullName || '');
                setAddress(draft.address || '');
                setCity(draft.city || '');
                setPostalCode(draft.postalCode || '');
                setPaymentMethod(draft.paymentMethod === 'cod' ? 'cod' : 'card');
            } catch {
                // ignore malformed draft
            }
        }

        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) { setSessionUser(session.user); setCustomerEmail(session.user.email || ''); }
        };
        fetchSession();
    }, [shop.id, shop.route_path, router, supabase.auth]);

    useEffect(() => {
        const draft = {
            fullName,
            address,
            city,
            postalCode,
            paymentMethod,
        };
        localStorage.setItem(`myshop_checkout_draft_${shop.id}`, JSON.stringify(draft));
    }, [shop.id, fullName, address, city, postalCode, paymentMethod]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantityMultiplier), 0);
    const rawTaxRate = typeof shop.tax_rate === 'number' ? shop.tax_rate : parseFloat(shop.tax_rate ?? '0');
    const normalizedTaxRate = Number.isFinite(rawTaxRate) ? rawTaxRate : 0;
    const taxCalc = cartTotal * (normalizedTaxRate / 100);
    const grandTotal = cartTotal + taxCalc;

    const validate = () => {
        const e: typeof errors = {};
        if (!fullName.trim()) e.fullName = 'Full name is required.';
        else if (fullName.trim().length < 2) e.fullName = 'Enter your full name.';
        if (!address.trim()) e.address = 'Street address is required.';
        if (!city.trim()) e.city = 'City is required.';
        if (!postalCode.trim()) e.postalCode = 'Postal code is required.';
        else if (!/^\d{4,6}$/.test(postalCode.trim())) e.postalCode = 'Enter a valid postal code (4–6 digits).';
        return e;
    };

    const handleBlur = (field: Fields) => {
        setTouched(t => ({ ...t, [field]: true }));
        setErrors(validate());
    };

    const fieldCls = (field: Fields, extra = '') =>
        `w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${extra} ${touched[field] && errors[field]
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
            : isDark
                ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600 focus:border-white focus:ring-1 focus:ring-white'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black hover:border-gray-400'
        }`;

    const handlePlaceOrder = async () => {
        setOrderError('');
        setOrderSuccess(null);
        const errs = validate();
        setErrors(errs);
        setTouched({ fullName: true, address: true, city: true, postalCode: true });
        if (Object.keys(errs).length > 0) return;
        if (cart.length === 0) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            alert('Please log in to place your order. You will be redirected to login.');
            router.push(`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/checkout`)}`);
            return;
        }

        if (!sessionUser) {
            setSessionUser(session.user);
            setCustomerEmail(session.user.email || '');
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/orders/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId: shop.id,
                    routePath: shop.route_path,
                    paymentMethod,
                    customer: {
                        email: customerEmail,
                        fullName: fullName.trim(),
                        address: address.trim(),
                        city: city.trim(),
                        postalCode: postalCode.trim(),
                    },
                    items: cart,
                }),
            });

            const json = await response.json() as { error?: string; orderId?: string };
            if (!response.ok || !json.orderId) {
                throw new Error(json.error || 'Failed to place order.');
            }

            localStorage.removeItem(`myshop_cart_${shop.id}`);
            localStorage.removeItem(`myshop_checkout_draft_${shop.id}`);
            setOrderSuccess('Payment successful. Your order has been placed successfully. Redirecting...');
            setTimeout(() => {
                router.push(`/shop/${shop.route_path}/checkout/success?orderId=${json.orderId}`);
            }, 900);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Please try again.';
            setOrderError(`Failed to place order: ${message}`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <button onClick={() => router.push(`/shop/${shop.route_path}`)} className="text-blue-600 hover:underline">Continue Shopping</button>
            </div>
        );
    }

    const isDark = shop.template === 'modern-dark';
    const tStyles = {
        card: isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200/60 text-gray-900',
        btn: isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
        muted: isDark ? 'text-gray-400' : 'text-gray-500',
    };

    return (
        <div className={`min-h-screen py-10 ${isDark ? 'bg-gray-950' : 'bg-gray-50/50'}`}>
            <div className="max-w-6xl mx-auto px-6">
                <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm font-medium hover:opacity-70 mb-10 transition-opacity ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <ArrowLeft className="w-4 h-4" /> Return to Cart
                </button>

                {orderError && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{orderError}</span>
                    </div>
                )}

                {orderSuccess && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 flex items-start gap-3 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{orderSuccess}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Form */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Shipping */}
                        <div className={`p-8 sm:p-10 rounded-3xl border shadow-sm ${tStyles.card}`}>
                            <div className="flex items-center gap-3 mb-8">
                                <MapPin className="w-6 h-6" />
                                <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Full Name *</label>
                                    <input type="text" value={fullName}
                                        onChange={e => { setFullName(e.target.value); if (touched.fullName) setErrors(v => ({ ...v, fullName: undefined })); }}
                                        onBlur={() => handleBlur('fullName')}
                                        className={fieldCls('fullName')} placeholder="Jane Doe" />
                                    <FieldError msg={touched.fullName ? errors.fullName : undefined} />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Street Address *</label>
                                    <input type="text" value={address}
                                        onChange={e => { setAddress(e.target.value); if (touched.address) setErrors(v => ({ ...v, address: undefined })); }}
                                        onBlur={() => handleBlur('address')}
                                        className={fieldCls('address')} placeholder="123 Main St" />
                                    <FieldError msg={touched.address ? errors.address : undefined} />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>City *</label>
                                        <input type="text" value={city}
                                            onChange={e => { setCity(e.target.value); if (touched.city) setErrors(v => ({ ...v, city: undefined })); }}
                                            onBlur={() => handleBlur('city')}
                                            className={fieldCls('city')} placeholder="Colombo" />
                                        <FieldError msg={touched.city ? errors.city : undefined} />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Postal Code *</label>
                                        <input type="text" value={postalCode}
                                            onChange={e => { setPostalCode(e.target.value); if (touched.postalCode) setErrors(v => ({ ...v, postalCode: undefined })); }}
                                            onBlur={() => handleBlur('postalCode')}
                                            className={fieldCls('postalCode')} placeholder="00100" maxLength={6} />
                                        <FieldError msg={touched.postalCode ? errors.postalCode : undefined} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className={`p-8 sm:p-10 rounded-3xl border shadow-sm ${tStyles.card}`}>
                            <div className="flex items-center gap-3 mb-8">
                                <Wallet className="w-6 h-6" />
                                <h2 className="text-2xl font-bold tracking-tight">Payment</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'card' ? (isDark ? 'border-white bg-white/5' : 'border-black bg-gray-50') : 'border-transparent bg-gray-100 opacity-60 hover:opacity-100'}`}>
                                    <input type="radio" className="sr-only" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                    <CreditCard className="w-8 h-8" />
                                    <span className="font-bold">Credit Card</span>
                                    <span className={`text-xs ${tStyles.muted}`}>Mock payment flow</span>
                                </label>
                                <label className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'cod' ? (isDark ? 'border-white bg-white/5' : 'border-black bg-gray-50') : 'border-transparent bg-gray-100 opacity-60 hover:opacity-100'}`}>
                                    <input type="radio" className="sr-only" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                    <Truck className="w-8 h-8" />
                                    <span className="font-bold">Cash on Delivery</span>
                                    <span className={`text-xs ${tStyles.muted}`}>Pay when it arrives</span>
                                </label>
                            </div>
                            {paymentMethod === 'card' && (
                                <div className="mt-6 p-4 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 flex items-start gap-4">
                                    <CreditCard className="w-6 h-6 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold mb-1">DEMO MODE</p>
                                        <p>No actual card information is required for this demo checkout.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-5">
                        <div className={`p-8 rounded-3xl border shadow-sm sticky top-8 ${tStyles.card}`}>
                            <h2 className="text-2xl font-bold tracking-tight mb-8">Summary</h2>
                            <div className="space-y-6 mb-8">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200/50">
                                            <img src={item.image || 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=400&q=80'} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm line-clamp-2 leading-snug">{item.title}</h4>
                                            <p className={`text-xs mt-1 ${tStyles.muted}`}>{formatPriceWithUnit(item.price, item.selling_unit, item.selling_unit_value)}</p>
                                            <p className={`text-xs mt-1 ${tStyles.muted}`}>Qty: x{item.quantityMultiplier} ({formatQuantityLabel(item.orderedQuantity, item.orderedUnit)})</p>
                                            <p className="font-bold text-sm mt-2">Rs. {(item.price * item.quantityMultiplier).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-8 border-t border-gray-200/60 space-y-4 text-sm font-medium">
                                <div className={`flex justify-between ${tStyles.muted}`}>
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>Rs. {cartTotal.toLocaleString()}</span>
                                </div>
                                <div className={`flex justify-between ${tStyles.muted}`}>
                                    <span>Tax ({normalizedTaxRate}%)</span>
                                    <span>Rs. {taxCalc.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black pt-6 pb-2">
                                    <span>Total</span>
                                    <span>Rs. {grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={isCheckingOut}
                                className={`w-full py-4 mt-8 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2 ${tStyles.btn}`}
                            >
                                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
                            </button>
                            <p className="text-xs text-center mt-3 text-gray-400">All fields marked with * are required</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
