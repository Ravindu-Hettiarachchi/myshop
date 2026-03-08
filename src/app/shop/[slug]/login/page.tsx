'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2 } from 'lucide-react';

export default function CustomerLogin({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.push(`/shop/${slug}`);
            router.refresh();
        } catch (error: any) {
            setErrorMsg(error.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShoppingBag className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-500">Sign in to continue shopping at <span className="font-semibold text-gray-700">{slug}</span></p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <form className="space-y-4" onSubmit={handleLogin}>
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{errorMsg}</div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition bg-white"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition bg-white"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <Link href={`/shop/${slug}/signup`} className="font-semibold text-gray-900 hover:underline">Create one</Link>
                </p>
            </div>
        </div>
    );
}
