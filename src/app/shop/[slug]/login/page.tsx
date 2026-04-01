'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2 } from 'lucide-react';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

type Fields = 'email' | 'password';

async function ensureShopCustomerLink(args: {
    slug: string;
    userId: string;
    email: string;
    fullName?: string | null;
}) {
    const supabase = createClient();
    const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('route_path', args.slug)
        .maybeSingle<{ id: string }>();

    if (!shop?.id) return;

    const { error } = await supabase
        .from('shop_customers')
        .upsert(
            {
                shop_id: shop.id,
                auth_user_id: args.userId,
                email: args.email,
                full_name: args.fullName ?? null,
            },
            { onConflict: 'shop_id,auth_user_id' }
        );

    if (error) {
        console.warn('Failed to link shop customer profile:', error.message);
    }
}

export default function CustomerLogin({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'Email is required.';
        else if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
        if (!password) e.password = 'Password is required.';
        return e;
    };

    const handleBlur = (field: Fields) => {
        setTouched(t => ({ ...t, [field]: true }));
        setErrors(validate());
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        const errs = validate();
        setErrors(errs);
        setTouched({ email: true, password: true });
        if (Object.keys(errs).length > 0) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            const userId = data.user?.id;
            const userEmail = data.user?.email || email;
            if (userId) {
                await ensureShopCustomerLink({
                    slug,
                    userId,
                    email: userEmail,
                    fullName: data.user?.user_metadata?.full_name as string | undefined,
                });
            }

            const nextPath = searchParams.get('next');
            const safeNext = nextPath && nextPath.startsWith(`/shop/${slug}/`) ? nextPath : `/shop/${slug}`;
            router.push(safeNext);
            router.refresh();
        } catch (error: unknown) {
            setServerError(error instanceof Error ? error.message : 'Login failed. Check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls = (field: Fields) =>
        `w-full px-4 py-3 border rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition bg-white ${touched[field] && errors[field]
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
        }`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShoppingBag className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-500">Sign in to continue shopping at <span className="font-semibold text-gray-700">{slug}</span></p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <form className="space-y-4" onSubmit={handleLogin} noValidate>
                        {serverError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{serverError}</div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                            <input type="email" value={email}
                                onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(v => ({ ...v, email: undefined })); }}
                                onBlur={() => handleBlur('email')}
                                className={inputCls('email')} placeholder="you@example.com" autoComplete="email" />
                            <FieldError msg={touched.email ? errors.email : undefined} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                            <input type="password" value={password}
                                onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(v => ({ ...v, password: undefined })); }}
                                onBlur={() => handleBlur('password')}
                                className={inputCls('password')} placeholder="••••••••" autoComplete="current-password" />
                            <FieldError msg={touched.password ? errors.password : undefined} />
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition flex justify-center items-center gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link
                        href={`/shop/${slug}/signup${searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next') || '')}` : ''}`}
                        className="font-semibold text-gray-900 hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
