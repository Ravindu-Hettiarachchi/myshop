'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Store, Clock, CheckCircle, Users, CreditCard } from 'lucide-react';

interface Stats {
    totalShops: number;
    pendingShops: number;
    approvedShops: number;
    totalOwners: number;
}

export default function AdminOverviewPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<Stats>({ totalShops: 0, pendingShops: 0, approvedShops: 0, totalOwners: 0 });
    const [pendingShops, setPendingShops] = useState<{ id: string; shop_name: string; route_path: string; created_at: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [{ data: shops }, { count: ownerCount }] = await Promise.all([
            supabase.from('shops').select('id, shop_name, route_path, is_approved, created_at').order('created_at', { ascending: false }),
            supabase.from('owners').select('*', { count: 'exact', head: true }).eq('role', 'shop_owner'),
        ]);

        const all = shops || [];
        setStats({
            totalShops: all.length,
            pendingShops: all.filter(s => !s.is_approved).length,
            approvedShops: all.filter(s => s.is_approved).length,
            totalOwners: ownerCount || 0,
        });
        setPendingShops(all.filter(s => !s.is_approved).slice(0, 5));
        setLoading(false);
    };

    const handleApprove = async (shopId: string) => {
        setApproving(shopId);
        await supabase.from('shops').update({ is_approved: true }).eq('id', shopId);
        setPendingShops(prev => prev.filter(s => s.id !== shopId));
        setStats(prev => ({ ...prev, pendingShops: prev.pendingShops - 1, approvedShops: prev.approvedShops + 1 }));
        setApproving(null);
    };

    const handleReject = async (shopId: string) => {
        if (!confirm('Are you sure you want to reject and delete this shop application?')) return;
        await supabase.from('shops').delete().eq('id', shopId);
        setPendingShops(prev => prev.filter(s => s.id !== shopId));
        setStats(prev => ({ ...prev, pendingShops: prev.pendingShops - 1, totalShops: prev.totalShops - 1 }));
    };

    const STAT_CARDS = [
        { label: 'Total Shops', value: stats.totalShops, color: 'text-blue-600', bg: 'bg-blue-50', icon: Store, iconColor: 'text-blue-500' },
        { label: 'Pending Review', value: stats.pendingShops, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, iconColor: 'text-amber-500' },
        { label: 'Live Shops', value: stats.approvedShops, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, iconColor: 'text-green-500' },
        { label: 'Shop Owners', value: stats.totalOwners, color: 'text-purple-600', bg: 'bg-purple-50', icon: Users, iconColor: 'text-purple-500' },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8 text-gray-900 font-sans max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Overview</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor the entire MyShop platform and manage incoming setup requests.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {STAT_CARDS.map(card => (
                    <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col items-start hover:shadow-md transition">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${card.bg.replace('bg-', 'border-')}`}>
                            <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>
                        <p className={`text-4xl font-black ${card.color}`}>{loading ? '—' : card.value}</p>
                        <p className="text-gray-500 text-sm font-medium mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Link href="/admin/shops" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:border-red-200 hover:shadow-md transition group flex flex-col">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Store className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-900 group-hover:text-red-600 transition">Manage Shops</p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Approve, reject, and view all active storefronts on the platform.</p>
                </Link>
                <Link href="/admin/owners" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:border-red-200 hover:shadow-md transition group flex flex-col">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-900 group-hover:text-red-600 transition">Manage Shop Owners</p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">View all registered owners and their associated profile details.</p>
                </Link>
                <Link href="/admin/subscriptions" className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:border-red-200 hover:shadow-md transition group flex flex-col">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-900 group-hover:text-red-600 transition">Subscriptions</p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">Monitor active plans, recent billing events, and overall revenue.</p>
                </Link>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        Pending Approvals
                        {stats.pendingShops > 0 && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">{stats.pendingShops}</span>
                        )}
                    </h2>
                    <Link href="/admin/shops" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">View All Dashboard →</Link>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin"></div>
                    </div>
                ) : pendingShops.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center bg-white">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-gray-900 font-bold text-lg mb-1">You're all caught up!</p>
                        <p className="text-gray-500 text-sm">There are no pending applications right now.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {pendingShops.map(shop => (
                            <li key={shop.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-lg border border-blue-100">
                                        {shop.shop_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{shop.shop_name}</p>
                                        <div className="flex items-center mt-1">
                                            <code className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                                shop-url: /shop/{shop.route_path}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleReject(shop.id)}
                                        className="px-4 py-2 text-sm rounded-xl font-semibold border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(shop.id)}
                                        disabled={approving === shop.id}
                                        className="px-6 py-2 text-sm rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {approving === shop.id ? 'Approving...' : 'Approve Shop'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
