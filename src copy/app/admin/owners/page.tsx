'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, X, Users, ShieldCheck, Store, UserCircle } from 'lucide-react';

interface Owner {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    admin: { label: 'Admin', bg: 'bg-red-900/50', text: 'text-red-400', icon: ShieldCheck },
    shop_owner: { label: 'Shop Owner', bg: 'bg-blue-900/50', text: 'text-blue-400', icon: Store },
    customer: { label: 'Customer', bg: 'bg-gray-800', text: 'text-gray-400', icon: UserCircle },
};

export default function AdminOwnersPage() {
    const supabase = createClient();
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        supabase
            .from('owners')
            .select('id, email, full_name, role, created_at')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) {
                    console.error('Owners fetch error:', error);
                    setError(`Failed to load owners: ${error.message}. The owners RLS policy may need to be updated — run database/fix_owners_rls.sql in Supabase.`);
                } else {
                    setOwners(data || []);
                }
                setLoading(false);
            });
    }, []);

    const filtered = owners.filter(o => {
        const matchSearch = !search ||
            o.email.toLowerCase().includes(search.toLowerCase()) ||
            (o.full_name || '').toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || o.role === roleFilter;
        return matchSearch && matchRole;
    });

    const counts = {
        all: owners.length,
        admin: owners.filter(o => o.role === 'admin').length,
        shop_owner: owners.filter(o => o.role === 'shop_owner').length,
        customer: owners.filter(o => o.role === 'customer').length,
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Directory</h1>
                    <p className="text-gray-400 text-sm mt-1">All registered accounts across the platform</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-white">{owners.length} total</span>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300">
                    <p className="font-semibold mb-1">⚠️ RLS Policy Issue Detected</p>
                    <p>{error}</p>
                    <p className="mt-2 text-xs text-red-400">
                        <strong>Fix:</strong> Open Supabase Dashboard → SQL Editor → run the contents of{' '}
                        <code className="bg-red-900/50 px-1 rounded">database/fix_owners_rls.sql</code>
                    </p>
                </div>
            )}

            {/* Stats Strip */}
            {!error && (
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { key: 'all', label: 'All Users', color: 'text-white' },
                        { key: 'shop_owner', label: 'Shop Owners', color: 'text-blue-400' },
                        { key: 'customer', label: 'Customers', color: 'text-gray-300' },
                        { key: 'admin', label: 'Admins', color: 'text-red-400' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setRoleFilter(s.key)}
                            className={`bg-gray-900 border rounded-xl p-4 text-left transition-all ${roleFilter === s.key ? 'border-blue-500 bg-blue-900/20' : 'border-gray-800 hover:border-gray-600'
                                }`}
                        >
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-2xl font-black ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 px-4 py-3">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Showing {filtered.length} of {owners.length} users</p>
                    {roleFilter !== 'all' && (
                        <button onClick={() => setRoleFilter('all')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <X className="w-3 h-3" /> Clear filter
                        </button>
                    )}
                </div>
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading users...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">{search ? 'No users match your search.' : 'No users found.'}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-6 py-3">User</th>
                                <th className="text-left px-6 py-3">Email</th>
                                <th className="text-left px-6 py-3">Role</th>
                                <th className="text-left px-6 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filtered.map(owner => {
                                const cfg = ROLE_CONFIG[owner.role] || ROLE_CONFIG.customer;
                                const RoleIcon = cfg.icon;
                                const initials = (owner.full_name || owner.email).slice(0, 2).toUpperCase();
                                return (
                                    <tr key={owner.id} className="hover:bg-gray-800/40 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white leading-none">{owner.full_name || '—'}</p>
                                                    <p className="text-xs text-gray-600 mt-0.5 font-mono">{owner.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{owner.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                                                <RoleIcon className="w-3 h-3" />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(owner.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
