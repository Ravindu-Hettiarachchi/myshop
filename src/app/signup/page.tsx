'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PlatformLogo from '@/components/PlatformLogo';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name.trim()) return setErrorMsg('Full name is required.');
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setErrorMsg('Please enter a valid email.');
        if (!password || password.length < 6) return setErrorMsg('Password must be at least 6 characters.');

        setIsLoading(true);
        const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

        if (error) { setErrorMsg(error.message); setIsLoading(false); return; }
        if (data.user?.identities?.length === 0) { setErrorMsg('This email is already registered.'); setIsLoading(false); return; }
        if (data.user) {
            await supabase.from('owners').insert([{ id: data.user.id, email: data.user.email, full_name: name, role: 'shop_owner' }]);
            router.push('/setup');
        }
    };

    const handleGoogleSignup = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/setup` } });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col w-[420px] p-12 relative overflow-hidden"
                style={{ background: '#0F172A' }}>
                {/* Subtle dot pattern */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />
                {/* Blue glow blobs */}
                <div className="absolute top-10 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: '#3B82F6' }} />
                <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: '#6366F1' }} />
                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                    <PlatformLogo variant="full" className="h-8" />
                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-3xl font-bold text-white mb-3 leading-tight">Launch your business online today</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">Get a professional storefront, inventory management, and order tracking in minutes.</p>
                        <div className="mt-8 space-y-3">
                            {['Isolated storefront with your branding', 'Real-time inventory & order tracking', 'Admin dashboard with analytics'].map(f => (
                                <div key={f} className="flex items-center gap-2.5 text-xs text-slate-400">
                                    <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 text-blue-400" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">© {new Date().getFullYear()} MyShop Platform</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden flex justify-center mb-10">
                        <PlatformLogo variant="full" className="h-8" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
                    <p className="text-sm text-gray-500 mb-8">
                        Already registered?{' '}
                        <Link href="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
                    </p>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition mb-6"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-medium">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <form className="space-y-4" onSubmit={handleEmailSignup}>
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <p className="text-sm text-red-600">{errorMsg}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition bg-white"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition bg-white"
                                placeholder="you@business.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition bg-white"
                                placeholder="Min. 6 characters"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                        </button>
                        <p className="text-xs text-center text-gray-400">
                            By signing up you agree to our{' '}
                            <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
