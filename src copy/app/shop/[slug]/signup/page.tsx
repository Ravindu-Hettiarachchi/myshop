'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

type Fields = 'fullName' | 'email' | 'password' | 'confirm';

export default function CustomerSignup({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const e: typeof errors = {};
        if (!fullName.trim()) e.fullName = 'Full name is required.';
        if (!email.trim()) e.email = 'Email is required.';
        else if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
        if (!password) e.password = 'Password is required.';
        else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
        if (!confirm) e.confirm = 'Please confirm your password.';
        else if (confirm !== password) e.confirm = 'Passwords do not match.';
        return e;
    };

    const handleBlur = (field: Fields) => {
        setTouched(t => ({ ...t, [field]: true }));
        setErrors(validate());
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        const errs = validate();
        setErrors(errs);
        setTouched({ fullName: true, email: true, password: true, confirm: true });
        if (Object.keys(errs).length > 0) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            if (data.user) {
                const { error: profileError } = await supabase.from('owners').upsert({
                    id: data.user.id, email: data.user.email, full_name: fullName, role: 'customer'
                });
                if (profileError) console.warn('Could not insert profile', profileError);
            }
            router.push(`/shop/${slug}`);
            router.refresh();
        } catch (error: any) {
            setServerError(error.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputCls = (field: Fields) =>
        `w-full px-4 py-3 border rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition bg-white ${touched[field] && errors[field]
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
        }`;

    const strength = !password ? 0 : [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
    const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength];
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShoppingBag className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
                    <p className="text-sm text-gray-500">Join <span className="font-semibold text-gray-700">{slug}</span> to track your orders</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <form className="space-y-4" onSubmit={handleSignup} noValidate>
                        {serverError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{serverError}</div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                            <input type="text" value={fullName}
                                onChange={(e) => { setFullName(e.target.value); if (touched.fullName) setErrors(v => ({ ...v, fullName: undefined })); }}
                                onBlur={() => handleBlur('fullName')}
                                className={inputCls('fullName')} placeholder="Jane Doe" autoComplete="name" />
                            <FieldError msg={touched.fullName ? errors.fullName : undefined} />
                        </div>
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
                                className={inputCls('password')} placeholder="Min. 8 characters" autoComplete="new-password" />
                            {password && (
                                <div className="mt-1.5">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400">Strength: <span className="font-medium text-gray-700">{strengthLabel}</span></p>
                                </div>
                            )}
                            <FieldError msg={touched.password ? errors.password : undefined} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input type="password" value={confirm}
                                    onChange={(e) => { setConfirm(e.target.value); if (touched.confirm) setErrors(v => ({ ...v, confirm: undefined })); }}
                                    onBlur={() => handleBlur('confirm')}
                                    className={inputCls('confirm')} placeholder="Repeat your password" autoComplete="new-password" />
                                {confirm && confirm === password && (
                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                )}
                            </div>
                            <FieldError msg={touched.confirm ? errors.confirm : undefined} />
                        </div>
                        <button type="submit" disabled={isLoading}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition flex justify-center items-center gap-2">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link href={`/shop/${slug}/login`} className="font-semibold text-gray-900 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
