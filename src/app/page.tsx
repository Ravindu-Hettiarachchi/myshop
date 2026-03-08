import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Palette, Package, TrendingUp, Star } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-blue-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <PlatformLogo variant="full" className="h-8" />
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm text-gray-500 font-medium hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                Login
              </Link>
              <Link href="/signup" className="text-sm bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 lg:pt-44 lg:pb-36 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f618_1px,transparent_1px),linear-gradient(to_bottom,#3b82f618_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Sri Lanka's #1 SaaS E-commerce Platform
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-none">
            Launch Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Online Store
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-lg text-gray-500 mb-10 leading-relaxed">
            Register your business, get verified, and launch a beautiful, isolated storefront in minutes. Full inventory, orders & analytics included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-200">
              Start For Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition text-sm">
              Sign In to Dashboard →
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-14 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: TrendingUp, label: '100+ Shops Live' },
              { icon: Package, label: '10k+ Orders Processed' },
              { icon: Star, label: '4.9/5 Rating' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-sm text-gray-400">
                <s.icon className="w-4 h-4 text-blue-400" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to grow</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'True Shop Isolation',
                desc: 'Your own dedicated route and database. Zero crosstalk between businesses.',
                color: 'bg-blue-50 text-blue-600',
                border: 'border-blue-100',
              },
              {
                icon: Zap,
                title: 'Smart Inventory',
                desc: 'Real-time stock tracking, low-stock thresholds, and automated reorder alerts.',
                color: 'bg-indigo-50 text-indigo-600',
                border: 'border-indigo-100',
              },
              {
                icon: Palette,
                title: '4 Premium Themes',
                desc: 'Pick from Minimal, Dark, Vibrant, or Boutique storefront designs. Switch anytime.',
                color: 'bg-violet-50 text-violet-600',
                border: 'border-violet-100',
              },
            ].map((f) => (
              <div key={f.title} className={`bg-white p-7 rounded-2xl border ${f.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group`}>
                <div className={`w-11 h-11 ${f.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-5 tracking-tight">Ready to sell online?</h2>
          <p className="text-blue-200 mb-10 text-lg">Join hundreds of Sri Lankan businesses on MyShop.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition text-sm shadow-xl">
            Create Your Shop — It's Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <PlatformLogo variant="full" className="h-7 brightness-0 invert opacity-70" />
          <p className="text-gray-500 text-xs">© {new Date().getFullYear()} MyShop SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
