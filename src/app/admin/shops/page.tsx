'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Circle, Clock, X, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface Shop {
    id: string;
    shop_name: string;
    route_path: string;
    is_approved: boolean;
    template: string;
    primary_color: string;
    created_at: string;
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    business_registration_no: string | null;
    business_images: string[] | null;
    nic_files: string[] | null;
}

export default function AdminShopsPage() {
    const supabase = createClient();
    const [shops, setShops] = useState<Shop[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'unverified'>('all');
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [reviewShop, setReviewShop] = useState<Shop | null>(null);

    const fetchShops = async () => {
        const { data } = await supabase
            .from('shops')
            .select('id, shop_name, route_path, is_approved, template, primary_color, created_at, verification_status, business_registration_no, business_images, nic_files')
            .order('created_at', { ascending: false });
        setShops(data || []);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setActionId(id);
        await supabase.from('shops').update({ is_approved: true, verification_status: 'verified' }).eq('id', id);
        setShops(prev => prev.map(s => s.id === id ? { ...s, is_approved: true, verification_status: 'verified' } : s));
        setActionId(null);
        setReviewShop(null);
    };

    const handleReject = async (id: string, isRevoke = false) => {
        if (isRevoke && !confirm('Revoke this shop? It will be hidden from customers.')) return;
        setActionId(id);
        await supabase.from('shops').update({ is_approved: false, verification_status: 'rejected' }).eq('id', id);
        setShops(prev => prev.map(s => s.id === id ? { ...s, is_approved: false, verification_status: 'rejected' } : s));
        setActionId(null);
        setReviewShop(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this shop? This cannot be undone.')) return;
        setActionId(id);
        await supabase.from('shops').delete().eq('id', id);
        setShops(prev => prev.filter(s => s.id !== id));
        setActionId(null);
    };

    const filtered = filter === 'all' ? shops 
        : filter === 'approved' ? shops.filter(s => s.is_approved)
        : filter === 'unverified' ? shops.filter(s => s.verification_status === 'unverified' || s.verification_status === 'rejected')
        : shops.filter(s => s.verification_status === 'pending');

    return (
        <div className="p-6 lg:p-8 space-y-6 text-white min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-white">Shops & Verifications</h1>
                <p className="text-gray-400 text-sm mt-1">Review verifications, approve stores to go live, and manage all storefronts.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'pending', 'approved', 'unverified'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        {f === 'all' ? `All (${shops.length})` 
                         : f === 'pending' ? `Pending Review (${shops.filter(s => s.verification_status === 'pending').length})` 
                         : f === 'unverified' ? `Unverified/Rejected (${shops.filter(s => ['unverified', 'rejected'].includes(s.verification_status)).length})`
                         : `Live (${shops.filter(s => s.is_approved).length})`}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                {loading ? (
                    <div className="py-16 text-center text-gray-600">Loading shops...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">No shops found matching filter.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase bg-gray-800/20">
                                    <th className="text-left px-6 py-4 font-semibold">Shop</th>
                                    <th className="text-left px-6 py-4 font-semibold">Verification</th>
                                    <th className="text-left px-6 py-4 font-semibold">Template</th>
                                    <th className="text-right px-6 py-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filtered.map(shop => (
                                    <tr key={shop.id} className="hover:bg-gray-800/40 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div style={{ backgroundColor: shop.primary_color || '#374151' }} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-inner">
                                                    {shop.shop_name[0]}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-white block">{shop.shop_name}</span>
                                                    <code className="text-xs text-blue-400 block mt-0.5">/shop/{shop.route_path}</code>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {shop.verification_status === 'verified' ? (
                                                <span className="text-green-400 bg-green-900/30 border border-green-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max font-medium">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Verified (Live)
                                                </span>
                                            ) : shop.verification_status === 'pending' ? (
                                                <span className="text-amber-400 bg-amber-900/30 border border-amber-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max font-medium animate-pulse">
                                                    <Clock className="w-3.5 h-3.5" /> Action Required (Pending)
                                                </span>
                                            ) : shop.verification_status === 'rejected' ? (
                                                <span className="text-red-400 bg-red-900/30 border border-red-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max font-medium">
                                                    <X className="w-3.5 h-3.5" /> Rejected
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 bg-gray-800 border border-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center w-max font-medium">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 capitalize">{(shop.template || 'minimal-white').replace('-', ' ')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Link href={`/shop/${shop.route_path}`} target="_blank" className="text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded transition bg-gray-800 hover:bg-gray-700">
                                                    Preview
                                                </Link>
                                                
                                                {shop.verification_status === 'pending' ? (
                                                    <button onClick={() => setReviewShop(shop)} className="text-xs px-3 py-1.5 rounded bg-blue-600 font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 flex items-center gap-1">
                                                        Review Setup
                                                    </button>
                                                ) : shop.is_approved ? (
                                                    <button onClick={() => handleReject(shop.id, true)} disabled={actionId === shop.id} className="text-xs px-3 py-1.5 rounded border border-rose-800 text-rose-400 hover:bg-rose-900/30 transition disabled:opacity-50">
                                                        {actionId === shop.id ? '...' : 'Revoke'}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleApprove(shop.id)} disabled={actionId === shop.id} className="text-xs px-3 py-1.5 rounded border border-green-800 text-green-500 hover:bg-green-900/30 transition disabled:opacity-50">
                                                        {actionId === shop.id ? '...' : 'Force Approve'}
                                                    </button>
                                                )}
                                                
                                                <button onClick={() => handleDelete(shop.id)} disabled={actionId === shop.id} className="text-xs text-gray-600 hover:text-red-500 p-1.5 transition disabled:opacity-50" title="Delete">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Verification Modal */}
            {reviewShop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Review Shop: {reviewShop.shop_name}</h2>
                                <p className="text-xs text-gray-400 truncate">/shop/{reviewShop.route_path}</p>
                            </div>
                            <button onClick={() => setReviewShop(null)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Business Registration</h3>
                                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg text-sm text-gray-200">
                                    {reviewShop.business_registration_no || <span className="text-gray-500 italic">No BR number provided.</span>}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">NIC Files</h3>
                                {reviewShop.nic_files?.length ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {reviewShop.nic_files.map((url, i) => (
                                            <a key={i} href={url} target="_blank" className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-[3/2] flex items-center justify-center bg-gray-800">
                                                <img src={url} alt={`NIC ${i}`} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ExternalLink className="w-6 h-6" /></div>
                                            </a>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500 italic">No NIC files uploaded.</p>}
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Business Evidence</h3>
                                {reviewShop.business_images?.length ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        {reviewShop.business_images.map((url, i) => (
                                            <a key={i} href={url} target="_blank" className="relative group rounded-lg overflow-hidden border border-gray-700 aspect-square flex items-center justify-center bg-gray-800">
                                                <img src={url} alt={`Business Evidence ${i}`} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ExternalLink className="w-6 h-6" /></div>
                                            </a>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500 italic">No business evidence uploaded.</p>}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/30 flex justify-end gap-3">
                            <button 
                                onClick={() => handleReject(reviewShop.id)}
                                disabled={actionId === reviewShop.id}
                                className="px-5 py-2.5 rounded-xl border border-red-900 bg-red-900/20 text-red-400 hover:bg-red-900/40 text-sm font-semibold transition disabled:opacity-50"
                            >
                                {actionId === reviewShop.id ? 'Loading...' : 'Reject Setup'}
                            </button>
                            <button 
                                onClick={() => handleApprove(reviewShop.id)}
                                disabled={actionId === reviewShop.id}
                                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionId === reviewShop.id ? 'Loading...' : <><CheckCircle className="w-4 h-4"/> Approve & Go Live</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
