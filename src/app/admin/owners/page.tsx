'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Owner {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
}

export default function AdminOwnersPage() {
    const supabase = createClient();
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from('owners')
            .select('id, email, full_name, role, created_at')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setOwners(data || []);
                setLoading(false);
            });
    }, []);

    const ROLE_COLORS: Record<string, string> = {
        admin: 'bg-red-900/50 text-red-400',
        shop_owner: 'bg-blue-900/50 text-blue-400',
        customer: 'bg-gray-800 text-gray-400',
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 text-white">
            <div>
                <h1 className="text-2xl font-bold text-white">Shop Owners</h1>
                <p className="text-gray-400 text-sm mt-1">All registered business owners on the platform.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                    <p className="text-sm text-gray-400">{owners.length} registered users</p>
                </div>
                {loading ? (
                    <div className="py-16 text-center text-gray-600">Loading...</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                                <th className="text-left px-6 py-3">Name</th>
                                <th className="text-left px-6 py-3">Email</th>
                                <th className="text-left px-6 py-3">Role</th>
                                <th className="text-left px-6 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {owners.map(owner => (
                                <tr key={owner.id} className="hover:bg-gray-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-sm">
                                                {(owner.full_name || owner.email)[0].toUpperCase()}
                                            </div>
                                            <span className="font-medium text-white">{owner.full_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{owner.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[owner.role] || ROLE_COLORS.customer}`}>
                                            {owner.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(owner.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
