'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Users, CreditCard, LogOut, Paintbrush, ShieldAlert } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';
import { createClient } from '@/utils/supabase/client';

const NAV = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/shops', label: 'Shops & Approvals', icon: Store },
    { href: '/admin/owners', label: 'Shop Owners', icon: Users },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
    { href: '/admin/themes', label: 'Theme Management', icon: Paintbrush },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [authChecked, setAuthChecked] = React.useState(false);

    React.useEffect(() => {
        const load = async () => {
            setIsAuthorized(false);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login?next=/admin');
                setAuthChecked(true);
                return;
            }

            const { data: owner } = await supabase
                .from('owners')
                .select('role')
                .eq('id', user.id)
                .maybeSingle<{ role: string | null }>();

            if (owner?.role !== 'admin') {
                router.replace('/dashboard');
                setAuthChecked(true);
                return;
            }

            setIsAuthorized(true);
            setAuthChecked(true);
        };

        load();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            load();
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    if (!authChecked || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 hidden md:flex flex-col fixed top-0 left-0 h-full z-30 shadow-xl">
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-gray-800 bg-gradient-to-r from-red-600 to-rose-700">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-white/80" />
                        <span className="text-white font-bold text-sm tracking-wide">Admin Panel</span>
                    </div>
                </div>

                {/* Logo area */}
                <div className="px-5 py-4 border-b border-gray-800">
                    <PlatformLogo variant="full" className="h-7 brightness-0 invert opacity-60" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-3">Platform Admin</p>
                    {NAV.map(item => {
                        const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                    active
                                        ? 'bg-red-600 text-white shadow-sm shadow-red-900'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} strokeWidth={2} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom User Area */}
                <div className="p-3 border-t border-gray-800 bg-gray-900/80">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-800 transition cursor-default">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">System Admin</p>
                            <p className="text-xs text-gray-500 truncate">Master Access</p>
                        </div>
                        <button onClick={handleSignOut} className="text-gray-600 hover:text-red-400 transition flex-shrink-0" title="Sign Out">
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 md:ml-64">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-gradient-to-r from-red-600 to-rose-700 flex items-center justify-between px-5 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-white/80" />
                        <span className="text-white font-bold text-sm">Admin Panel</span>
                    </div>
                    <button onClick={handleSignOut} className="text-red-200 hover:text-white transition">
                        <LogOut className="w-4 h-4" />
                    </button>
                </header>

                <div className="flex-1 overflow-auto bg-gray-950">
                    {children}
                </div>
            </main>
        </div>
    );
}
