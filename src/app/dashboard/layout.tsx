'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { LayoutDashboard, Palette, Package as PackageIcon, LogOut } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const [displayName, setDisplayName] = useState('...');
    const [shopName, setShopName] = useState('');

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: owner } = await supabase.from('owners').select('full_name').eq('id', user.id).single();
            const { data: shop } = await supabase.from('shops').select('shop_name').eq('owner_id', user.id).single();
            setDisplayName(owner?.full_name || user.email?.split('@')[0] || 'Shop Owner');
            setShopName(shop?.shop_name || '');
        };
        load();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
                <div className="h-20 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <PlatformLogo variant="icon" />
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2">
                    <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Menu
                    </div>

                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium transition group font-sans">
                        <LayoutDashboard className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        Overview
                    </Link>

                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium transition group font-sans">
                        <Palette className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        Storefront Settings
                    </Link>

                    <Link href="/dashboard/manage/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium transition group font-sans">
                        <PackageIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        Products & Inventory
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            {displayName[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{shopName || 'No shop yet'}</p>
                        </div>
                        <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500" title="Sign Out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 md:hidden">
                    <div className="flex items-center gap-2">
                        <PlatformLogo variant="icon" />
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
