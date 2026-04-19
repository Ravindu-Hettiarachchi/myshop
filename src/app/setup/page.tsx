'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Store, Rocket, ShieldCheck, Palette, Server, ArrowRight, MessageCircleQuestion, CheckCircle2 } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';

export default function SetupInstructionPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: shop } = await supabase
                .from('shops')
                .select('route_path')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (shop) {
                router.push(`/dashboard/${shop.route_path}`);
                return;
            }

            const { data: owner } = await supabase.from('owners').select('full_name').eq('id', user.id).single();
            setUserName(owner?.full_name?.split(' ')[0] || 'there');
            setLoading(false);
        };

        checkStatus();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-100">
            {/* Minimal App Header */}
            <header className="w-full bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-10 sticky top-0">
                <PlatformLogo variant="full" className="!h-8 !w-auto" />
                <div className="flex items-center gap-4">
                    <Link href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition">
                        <MessageCircleQuestion className="w-4 h-4" /> Help
                    </Link>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-red-600 transition">
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up pb-48">
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-4 border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Account Verified
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Welcome, {userName}. Let&apos;s get you set up.
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Before you create your shop, please review this quick guide on how our platform works, what we provide, and the verification process.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Section 1: Our Service & Customization */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row items-center hover:border-blue-200 transition-colors">
                        <div className="p-6 sm:p-8 flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Server className="w-5 h-5" /></div>
                                <h2 className="text-xl font-bold text-gray-900">What We Provide</h2>
                            </div>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                MyShop is a full-stack SaaS infrastructure. By creating a shop here, you instantly receive a dedicated secure database, an isolated storefront deployed to the edge, and a powerful Admin Dashboard to manage your inventory and live sales.
                            </p>

                            <div className="flex items-center gap-3 mb-2 mt-6">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Palette className="w-5 h-5" /></div>
                                <h3 className="text-lg font-bold text-gray-900">Limitless Customization</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                You have total control over your brand. Use our template engine to upload logos, pick custom brand colors, switch between light/dark modes, and render a beautiful, dynamic storefront on your unique path-based URL like <span className="font-mono text-gray-800">myshop.com/shop/shopname</span>.
                            </p>
                        </div>
                        <div className="w-full md:w-1/3 bg-gray-50 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l border-gray-100 h-full min-h-[250px] relative overflow-hidden">
                            <img src="/storefront_preview.png" alt="Preview" className="absolute -right-12 top-1/2 -translate-y-1/2 w-80 rounded-xl shadow-2xl border border-white transform -rotate-6 hover:rotate-0 transition-transform duration-500" />
                        </div>
                    </div>

                    {/* Section 2: Instructions & Verification */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 hover:border-blue-200 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-gray-400" /> How to Create Your Shop (3 Steps)
                        </h2>

                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-600 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 relative">
                                    1
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">Submit Details</h3>
                                    <p className="text-gray-600 text-sm">Provide your official Store Name and desired Subdomain URL in the next form.</p>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-500 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 relative">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm text-left md:text-right">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1 text-left md:text-right">Admin Verification</h3>
                                    <p className="text-gray-600 text-sm text-left md:text-right">To ensure platform safety, our admins must quickly review and approve your application. <strong className="text-amber-700">This keeps our ecosystem clean.</strong></p>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-green-600 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 relative">
                                    3
                                </div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1">Go Live!</h3>
                                    <p className="text-gray-600 text-sm">Once approved, access your dashboard instantly to manage inventory and launch your store.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Our Plans */}
                    <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                        {/* Subtle background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                        <div className="text-white z-10">
                            <h2 className="text-xl font-bold mb-2">Platform Pricing Plans</h2>
                            <p className="text-gray-400 text-sm max-w-md">Start building immediately for free. Upgrade to unlock limitless API features, premium themes, and dedicated support.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-10">
                            <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl text-center min-w-[140px]">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">Starter Plan</p>
                                <p className="text-2xl font-black text-white">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-500 p-4 rounded-xl text-center min-w-[140px] shadow-lg shadow-blue-900/50">
                                <p className="text-blue-200 text-xs font-bold uppercase tracking-wide mb-1">Professional</p>
                                <p className="text-2xl font-black text-white">$29<span className="text-sm font-normal text-blue-300">/mo</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-gray-900 hidden md:block">Ready to begin?</p>
                        <p className="text-xs text-gray-500 hidden md:block">You can verify your business now or skip it for later.</p>
                    </div>
                    <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
                        <Link href="/onboarding" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm shadow-sm transition-all focus:ring-2 focus:ring-gray-200">
                            Create Shop (Skip Verification)
                        </Link>
                        <Link href="/onboarding?verify=true" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.02]">
                            Verify Business & Start <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
