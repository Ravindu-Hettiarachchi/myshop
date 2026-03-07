'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Clock, Store, Plus, Palette, Eye, Package } from 'lucide-react';

interface Shop {
    id: string;
    shop_name: string;
    route_path: string;
    is_approved: boolean;
    primary_color: string;
}

interface OrderStats {
    total: number;
    processing: number;
    revenue: number;
}

export default function DashboardOverview() {
    const supabase = createClient();
    const [shop, setShop] = useState<Shop | null>(null);
    const [userName, setUserName] = useState('');
    const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, processing: 0, revenue: 0 });
    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get owner details
        const { data: owner } = await supabase
            .from('owners')
            .select('full_name')
            .eq('id', user.id)
            .single();
        setUserName(owner?.full_name || user.email?.split('@')[0] || 'Shop Owner');

        // Get shop
        const { data: shopData } = await supabase
            .from('shops')
            .select('id, shop_name, route_path, is_approved, primary_color')
            .eq('owner_id', user.id)
            .single();
        setShop(shopData);

        if (shopData) {
            // Get orders
            const { data: orders } = await supabase
                .from('orders')
                .select('total_amount, status')
                .eq('shop_id', shopData.id);

            const all = orders || [];
            setOrderStats({
                total: all.length,
                processing: all.filter(o => o.status === 'processing').length,
                revenue: all.reduce((sum, o) => sum + Number(o.total_amount), 0),
            });

            // Get low stock products
            const { data: products } = await supabase
                .from('products')
                .select('stock_quantity, low_stock_threshold')
                .eq('shop_id', shopData.id);

            setLowStockCount((products || []).filter(p => p.stock_quantity <= p.low_stock_threshold).length);
        }

        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-screen">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

            {/* Pending status banner */}
            {shop && !shop.is_approved && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <Clock className="text-amber-500 mt-0.5 w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-900">Your shop is under review</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Our team is verifying your business details. Once approved, your shop at{' '}
                            <span className="font-mono font-semibold">/shop/{shop.route_path}</span> will go live for customers.
                            You can still customize your storefront in the meantime!
                        </p>
                    </div>
                    <Link href="/dashboard/settings" className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition whitespace-nowrap">
                        Customize Store
                    </Link>
                </div>
            )}

            {/* Verified banner */}
            {shop?.is_approved && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                    <p className="text-green-800 font-medium text-sm flex-1">
                        Your shop is <strong>Live</strong> at{' '}
                        <a href={`/shop/${shop.route_path}`} target="_blank" className="underline font-mono">/shop/{shop.route_path}</a>
                    </p>
                    <a href={`/shop/${shop.route_path}`} target="_blank" className="text-sm bg-green-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition">
                        View Live Store ↗
                    </a>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName} 👋</h1>
                <p className="text-gray-500 text-sm mt-1">{shop?.shop_name || 'Your shop'} — Dashboard Overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">Rs. {orderStats.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">From {orderStats.total} orders</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Active Orders</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{orderStats.processing}</p>
                    <p className="text-xs text-orange-500 font-medium mt-1">{orderStats.processing} pending fulfillment</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Low Stock Alerts</p>
                    <p className={`text-3xl font-black mt-2 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</p>
                    {lowStockCount > 0 ? (
                        <Link href="/dashboard/manage/products" className="text-xs text-red-600 font-medium mt-1 hover:underline block">Restock now →</Link>
                    ) : (
                        <p className="text-xs text-green-600 mt-1">All products stocked ✓</p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Add Product', href: '/dashboard/manage/products', icon: Plus },
                    { label: 'Storefront Settings', href: '/dashboard/settings', icon: Palette },
                    { label: 'Preview Store', href: shop ? `/shop/${shop.route_path}` : '#', icon: Eye, external: true },
                    { label: 'View Orders', href: '#', icon: Package },
                ].map((action, i) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        target={action.external ? '_blank' : undefined}
                        className="bg-white border border-gray-100 rounded-2xl p-5 text-center hover:shadow-md hover:border-gray-200 transition group flex flex-col items-center"
                    >
                        <action.icon className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-700">{action.label}</p>
                    </Link>
                ))}
            </div>

            {!shop && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <Store className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">You don't have a shop yet!</h3>
                    <p className="text-blue-700 text-sm mb-5">Complete the onboarding process to create your storefront.</p>
                    <Link href="/onboarding" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
                        Start Shop Setup →
                    </Link>
                </div>
            )}
        </div>
    );
}
