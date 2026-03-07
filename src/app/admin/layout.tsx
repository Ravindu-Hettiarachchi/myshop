import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Store, Users, CreditCard, LogOut } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';

const NAV = [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/admin/shops', label: 'Shops & Approvals', icon: <Store className="w-5 h-5" /> },
    { href: '/admin/owners', label: 'Shop Owners', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10">
                <div className="h-24 flex items-center justify-center border-b border-gray-100">
                    <PlatformLogo variant="full" className="h-12" />
                </div>

                <nav className="flex-1 py-6 px-4 space-y-1">
                    <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Platform Admin</p>
                    {NAV.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 font-semibold transition group"
                        >
                            <span className="text-gray-400 group-hover:text-red-500 transition">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shadow-sm">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">System Admin</p>
                            <p className="text-xs text-gray-500 font-medium truncate">Master Access</p>
                        </div>
                        <Link href="/login" className="text-gray-400 hover:text-red-600 transition p-2">
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
                {/* Mobile Header */}
                <header className="md:hidden h-20 bg-white border-b border-gray-200 flex items-center justify-center">
                    <PlatformLogo variant="full" className="h-10" />
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
