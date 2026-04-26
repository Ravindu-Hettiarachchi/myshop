'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LayoutDashboard, Palette, Package as PackageIcon, LogOut, ShoppingBag, ExternalLink, ChevronRight, ShieldCheck } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';
import { buildStorefrontUrl } from '@/lib/storefront';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams<{ shopSlug?: string }>();
    const [displayName, setDisplayName] = useState('...');
    const [shopName, setShopName] = useState('');
    const [routePath, setRoutePath] = useState('');
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsAuthorized(false);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace(`/login?next=${encodeURIComponent(pathname || '/dashboard')}`);
                setAuthChecked(true);
                return;
            }

            const { data: owner } = await supabase
                .from('owners')
                .select('full_name, role')
                .eq('id', user.id)
                .maybeSingle<{ full_name: string | null; role: string | null }>();

            const role = owner?.role;
            const allowed = role === 'shop_owner' || role === 'admin';
            if (!allowed) {
                router.replace('/');
                setAuthChecked(true);
                return;
            }

            let shopQuery = supabase
                .from('shops')
                .select('shop_name, route_path, verification_status')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (params?.shopSlug) {
                shopQuery = shopQuery.eq('route_path', params.shopSlug);
            }

            const { data: shop } = await shopQuery.maybeSingle();
            setDisplayName(owner?.full_name || user.email?.split('@')[0] || 'Shop Owner');
            setShopName(shop?.shop_name || '');
            setRoutePath(shop?.route_path || '');
            setVerificationStatus(shop?.verification_status || 'unverified');
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
    }, [params?.shopSlug, supabase, router, pathname]);

    if (!authChecked || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navItems = [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Products', href: '/dashboard/products', icon: PackageIcon },
        { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
        { label: 'Storefront', href: '/dashboard/settings', icon: Palette },
        { label: 'Account', href: '/dashboard/account', icon: ShieldCheck },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-gray-100 hidden md:flex flex-col fixed top-0 left-0 h-full z-30 shadow-sm">
                {/* Logo area */}
                <div className="h-16 flex items-center px-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <PlatformLogo variant="full" className="h-7 brightness-0 invert" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">Main Menu</p>
                    {navItems.map((item) => {
                        const active = item.href === '/dashboard' ? pathname === '/dashboard' 
                                     : item.href === '/dashboard/settings' ? pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/')
                                     : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} strokeWidth={2} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                    {routePath && (
                        <a
                            href={buildStorefrontUrl(routePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition mb-1 group"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                            View Live Shop
                            <ChevronRight className="w-3 h-3 ml-auto" />
                        </a>
                    )}
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white transition cursor-default">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {displayName[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{shopName || 'No shop yet'}</p>
                        </div>
                        <button onClick={handleSignOut} className="text-gray-300 hover:text-red-500 transition flex-shrink-0" title="Sign Out">
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 md:ml-60">
                {/* Mobile Top Bar */}
                <header className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between px-5 md:hidden sticky top-0 z-20">
                    <PlatformLogo variant="full" className="h-7 brightness-0 invert" />
                    <button onClick={handleSignOut} className="text-blue-200 hover:text-white transition">
                        <LogOut className="w-4 h-4" />
                    </button>
                </header>

                {verificationStatus === 'unverified' && (
                    <div className="bg-rose-50 border-b border-rose-100 p-3 flex flex-col sm:flex-row justify-between items-center text-sm gap-2 z-10 sticky top-0 md:top-0">
                        <p className="text-rose-800 font-medium whitespace-normal">Finish the verification process to go live.</p>
                        <Link href="/dashboard/account" className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-rose-200 hover:bg-rose-700 transition">
                            Verify Now
                        </Link>
                    </div>
                )}
                {verificationStatus === 'pending' && (
                    <div className="bg-amber-50 border-b border-amber-100 p-3 flex justify-center items-center text-sm z-10 sticky top-0 md:top-0">
                        <p className="text-amber-800 font-medium">Verification is pending. Our admins will verify your shop shortly.</p>
                    </div>
                )}
                {verificationStatus?.startsWith('rejected') && (
                    <div className="bg-red-600 text-white p-3 flex flex-col sm:flex-row justify-between items-center text-sm gap-2 z-10 sticky top-0 md:top-0">
                        <p className="font-medium whitespace-normal">Your verification was rejected. Please review account details and resubmit.</p>
                        <Link href="/dashboard/account" className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition">
                            View Status
                        </Link>
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
