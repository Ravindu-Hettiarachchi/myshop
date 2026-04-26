'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PlatformLogo from '@/components/PlatformLogo';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

type Fields = 'name' | 'email' | 'password' | 'confirm';

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'Full name is required.';
        else if (name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
        if (!email.trim()) e.email = 'Email is required.';
        else if (!isValidEmail(email)) e.email = 'Enter a valid email address.';
        if (!password) e.password = 'Password is required.';
        else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
        else if (!/[A-Z]/.test(password)) e.password = 'Include at least one uppercase letter.';
        else if (!/[0-9]/.test(password)) e.password = 'Include at least one number.';
        if (!confirm) e.confirm = 'Please confirm your password.';
        else if (confirm !== password) e.confirm = 'Passwords do not match.';
        return e;
    };

    const handleBlur = (field: Fields) => {
        setTouched(t => ({ ...t, [field]: true }));
        setErrors(validate());
    };

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);
        const errs = validate();
        setErrors(errs);
        setTouched({ name: true, email: true, password: true, confirm: true });
        if (Object.keys(errs).length > 0) return;

        setIsLoading(true);
        try {
            const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

            if (error) { setServerError(error.message); return; }
            if (data.user?.identities?.length === 0) { setServerError('This email is already registered.'); return; }
            if (data.user) {
                await supabase.from('owners').insert([{ id: data.user.id, email: data.user.email, full_name: name, role: 'shop_owner' }]);
                router.push('/setup');
            }
        } catch {
            setServerError('Network error while contacting Supabase. Check your internet, VPN/firewall, and browser privacy extensions, then try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setServerError(null);
        try {
            await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/setup` } });
        } catch {
            setServerError('Google sign-in could not be started. Please check your network and try again.');
        }
    };

    const inputCls = (field: Fields) =>
        `w-full px-4 py-3 border rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 transition bg-white ${touched[field] && errors[field]
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'
        }`;

    // Password strength
    const strength = !password ? 0 : [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)].filter(Boolean).length;
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
    const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col w-[420px] p-12 relative overflow-hidden"
                style={{ background: '#0F172A' }}>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />
                <div className="absolute top-10 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: '#3B82F6' }} />
                <div className="absolute bottom-10 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: '#6366F1' }} />
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

                    <form className="space-y-4" onSubmit={handleEmailSignup} noValidate>
                        {serverError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                <p className="text-sm text-red-600">{serverError}</p>
                            </div>
                        )}
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                            <input type="text" value={name}
                                onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(v => ({ ...v, name: undefined })); }}
                                onBlur={() => handleBlur('name')}
                                className={inputCls('name')} placeholder="Jane Doe" autoComplete="name" />
                            <FieldError msg={touched.name ? errors.name : undefined} />
                        </div>
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                            <input type="email" value={email}
                                onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(v => ({ ...v, email: undefined })); }}
                                onBlur={() => handleBlur('email')}
                                className={inputCls('email')} placeholder="you@business.com" autoComplete="email" />
                            <FieldError msg={touched.email ? errors.email : undefined} />
                        </div>
                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(v => ({ ...v, password: undefined })); }}
                                    onBlur={() => handleBlur('password')}
                                    className={inputCls('password') + " pr-10"} placeholder="Min. 8 characters" autoComplete="new-password" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength meter */}
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
                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input type={showConfirm ? "text" : "password"} value={confirm}
                                    onChange={(e) => { setConfirm(e.target.value); if (touched.confirm) setErrors(v => ({ ...v, confirm: undefined })); }}
                                    onBlur={() => handleBlur('confirm')}
                                    className={inputCls('confirm') + " pr-16"} placeholder="Repeat your password" autoComplete="new-password" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    {confirm && confirm === password && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    )}
                                </div>
                            </div>
                            <FieldError msg={touched.confirm ? errors.confirm : undefined} />
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
