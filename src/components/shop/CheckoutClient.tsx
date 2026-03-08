'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowLeft, CreditCard, Wallet, MapPin, Truck } from 'lucide-react';

interface CartItem {
    id: string;
    title: string;
    price: number;
    cartQuantity: number;
    image: string;
}

export default function CheckoutClient({ shop }: { shop: any }) {
    const router = useRouter();
    const supabase = createClient();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerEmail, setCustomerEmail] = useState('');
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Shipping & Payment State
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');

    useEffect(() => {
        // Hydrate from localStorage where StorefrontClient syncs
        const savedCart = localStorage.getItem(`myshop_cart_${shop.id}`);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }

        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setSessionUser(session.user);
                setCustomerEmail(session.user.email || '');
            } else {
                // If they bypassed the auth gate, boot them out
                router.push(`/shop/${shop.route_path}/login`);
            }
        };
        fetchSession();
    }, [shop.id, shop.route_path, router, supabase.auth]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const taxCalculation = cartTotal * (parseFloat(shop.tax_rate || '0') / 100);
    const grandTotal = cartTotal + taxCalculation;

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionUser || cart.length === 0) return;

        setIsCheckingOut(true);

        try {
            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    shop_id: shop.id,
                    customer_email: customerEmail,
                    total_amount: grandTotal,
                    status: 'processing'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Order Items
            const orderItems = cart.map((item: any) => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.cartQuantity,
                unit_price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            // 3. Clear Cart & Redirect to public tracker
            localStorage.removeItem(`myshop_cart_${shop.id}`);
            router.push(`/shop/${shop.route_path}/order/${orderData.id}`);

        } catch (error: any) {
            console.error('Checkout failed:', JSON.stringify(error, null, 2), error.message);
            alert(`Failed to place order: ${error.message || 'Validation error'}. Please try again.`);
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <button onClick={() => router.push(`/shop/${shop.route_path}`)} className="text-blue-600 hover:underline">
                    Continue Shopping
                </button>
            </div>
        );
    }

    const isDark = shop.template === 'modern-dark';
    const tStyles = {
        card: isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200/60 text-gray-900',
        input: isDark ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600 focus:border-white focus:ring-1 focus:ring-white' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-black focus:ring-1 focus:ring-black hover:border-gray-400',
        btn: isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800',
        muted: isDark ? 'text-gray-400' : 'text-gray-500',
    };

    return (
        <div className={`min-h-screen py-10 ${isDark ? 'bg-gray-950' : 'bg-gray-50/50'}`}>
            <div className="max-w-6xl mx-auto px-6">
                <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm font-medium hover:opacity-70 mb-10 transition-opacity ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <ArrowLeft className="w-4 h-4" /> Return to Cart
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Form Details */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Shipping Informtion Panel */}
                        <div className={`p-8 sm:p-10 rounded-3xl border shadow-sm ${tStyles.card}`}>
                            <div className="flex items-center gap-3 mb-8">
                                <MapPin className="w-6 h-6" />
                                <h2 className="text-2xl font-bold tracking-tight">Shipping</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Full Name</label>
                                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${tStyles.input}`} placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Street Address</label>
                                    <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${tStyles.input}`} placeholder="123 Main St" />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>City</label>
                                        <input type="text" required value={city} onChange={e => setCity(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${tStyles.input}`} placeholder="Colombo" />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${tStyles.muted}`}>Postal Code</label>
                                        <input type="text" required className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${tStyles.input}`} placeholder="00100" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information Panel */}
                        <div className={`p-8 sm:p-10 rounded-3xl border shadow-sm ${tStyles.card}`}>
                            <div className="flex items-center gap-3 mb-8">
                                <Wallet className="w-6 h-6" />
                                <h2 className="text-2xl font-bold tracking-tight">Payment</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'card' ? (isDark ? 'border-white bg-white/5' : 'border-black bg-gray-50') : 'border-transparent bg-gray-100 dark:bg-gray-800/50 opacity-60 hover:opacity-100'}`}>
                                    <input type="radio" className="sr-only" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                    <CreditCard className="w-8 h-8" />
                                    <span className="font-bold">Credit Card</span>
                                    <span className={`text-xs ${tStyles.muted}`}>Mock payment flow</span>
                                </label>

                                <label className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === 'cod' ? (isDark ? 'border-white bg-white/5' : 'border-black bg-gray-50') : 'border-transparent bg-gray-100 dark:bg-gray-800/50 opacity-60 hover:opacity-100'}`}>
                                    <input type="radio" className="sr-only" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                    <Truck className="w-8 h-8" />
                                    <span className="font-bold">Cash on Delivery</span>
                                    <span className={`text-xs ${tStyles.muted}`}>Pay when it arrives</span>
                                </label>
                            </div>

                            {/* Mock Card Warning */}
                            {paymentMethod === 'card' && (
                                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 flex items-start gap-4">
                                    <CreditCard className="w-6 h-6 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold mb-1">MOCK DEMO MODE ACTIVATED</p>
                                        <p>Since this is a demo, no actual credit card information is required or processed. Billing bypasses authorized check securely.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5">
                        <div className={`p-8 rounded-3xl border shadow-sm sticky top-8 ${tStyles.card}`}>
                            <h2 className="text-2xl font-bold tracking-tight mb-8">Summary</h2>

                            <div className="space-y-6 mb-8">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200/50">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm line-clamp-2 leading-snug">{item.title}</h4>
                                            <p className={`text-xs mt-1 ${tStyles.muted}`}>Qty: {item.cartQuantity}</p>
                                            <p className="font-bold text-sm mt-2 tracking-tight">රු {(item.price * item.cartQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-gray-200/60 dark:border-gray-800/60 space-y-4 text-sm font-medium">
                                <div className={`flex justify-between ${tStyles.muted}`}>
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>රු {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className={`flex justify-between ${tStyles.muted}`}>
                                    <span>Shipping</span>
                                    <span>Calculated at next step</span>
                                </div>
                                <div className={`flex justify-between ${tStyles.muted}`}>
                                    <span>Tax ({shop.tax_rate || 0}%)</span>
                                    <span>රු {taxCalculation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black pt-6 pb-2">
                                    <span>Total</span>
                                    <span>
                                        රු {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <button
                                disabled={isCheckingOut || !fullName || !address || !city}
                                onClick={handlePlaceOrder}
                                className={`w-full py-4.5 mt-8 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2 ${tStyles.btn}`}
                            >
                                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : `Place Order`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
