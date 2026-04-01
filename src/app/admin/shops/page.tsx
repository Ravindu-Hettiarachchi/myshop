'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Circle, Clock } from 'lucide-react';

interface Shop {
    id: string;
    shop_name: string;
    route_path: string;
    is_approved: boolean;
    template: string;
    primary_color: string;
    created_at: string;
}

export default function AdminShopsPage() {
    const supabase = createClient();
    const [shops, setShops] = useState<Shop[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => { fetchShops(); }, []);

    const fetchShops = async () => {
        const { data } = await supabase
            .from('shops')
            .select('id, shop_name, route_path, is_approved, template, primary_color, created_at')
            .order('created_at', { ascending: false });
        setShops(data || []);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setActionId(id);
        await supabase.from('shops').update({ is_approved: true }).eq('id', id);
        setShops(prev => prev.map(s => s.id === id ? { ...s, is_approved: true } : s));
        setActionId(null);
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Revoke this shop? It will be hidden from customers but the owner can still access their dashboard.')) return;
        setActionId(id);
        await supabase.from('shops').update({ is_approved: false }).eq('id', id);
        setShops(prev => prev.map(s => s.id === id ? { ...s, is_approved: false } : s));
        setActionId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this shop? This cannot be undone.')) return;
        setActionId(id);
        await supabase.from('shops').delete().eq('id', id);
        setShops(prev => prev.filter(s => s.id !== id));
        setActionId(null);
    };

    const filtered = filter === 'all' ? shops : shops.filter(s => filter === 'approved' ? s.is_approved : !s.is_approved);

    return (
        <div className="p-6 lg:p-8 space-y-6 text-white">
            <div>
                <h1 className="text-2xl font-bold text-white">Shops & Approvals</h1>
                <p className="text-gray-400 text-sm mt-1">Review, approve, and manage all storefronts on the platform.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === f ? 'bg-red-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        {f === 'all' ? `All (${shops.length})` : f === 'pending' ? `Pending (${shops.filter(s => !s.is_approved).length})` : `Live (${shops.filter(s => s.is_approved).length})`}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-gray-600">Loading shops...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">No shops found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                                <th className="text-left px-6 py-3">Shop</th>
                                <th className="text-left px-6 py-3">Route</th>
                                <th className="text-left px-6 py-3">Template</th>
                                <th className="text-left px-6 py-3">Status</th>
                                <th className="text-right px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filtered.map(shop => (
                                <tr key={shop.id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div style={{ backgroundColor: shop.primary_color || '#374151' }} className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                                                {shop.shop_name[0]}
                                            </div>
                                            <span className="font-medium text-white">{shop.shop_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">/shop/{shop.route_path}</code>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 capitalize">{(shop.template || 'minimal-white').replace('-', ' ')}</td>
                                    <td className="px-6 py-4">
                                        {shop.is_approved ? (
                                            <span className="bg-green-900/50 text-green-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-max"><Circle className="w-3 h-3 fill-current" /> Live</span>
                                        ) : (
                                            <span className="bg-amber-900/50 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <Link href={`/shop/${shop.route_path}`} target="_blank" className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition">
                                                Preview
                                            </Link>
                                            <Link href={`/admin/shops/${shop.route_path}`} className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition">
                                                Manage
                                            </Link>
                                            {shop.is_approved ? (
                                                <button onClick={() => handleRevoke(shop.id)} disabled={actionId === shop.id} className="text-xs px-3 py-1 rounded border border-amber-800 text-amber-400 hover:bg-amber-900/30 transition disabled:opacity-50">
                                                    {actionId === shop.id ? '...' : 'Revoke'}
                                                </button>
                                            ) : (
                                                <button onClick={() => handleApprove(shop.id)} disabled={actionId === shop.id} className="text-xs px-3 py-1 rounded bg-green-700 text-white hover:bg-green-600 transition disabled:opacity-50">
                                                    {actionId === shop.id ? '...' : 'Approve'}
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(shop.id)} disabled={actionId === shop.id} className="text-xs px-3 py-1 rounded border border-red-900 text-red-500 hover:bg-red-900/30 transition disabled:opacity-50">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
