import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, ShieldCheck, Zap, Palette } from 'lucide-react';
import PlatformLogo from '@/components/PlatformLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2">
              <PlatformLogo variant="full" className="md:h-16" />
            </div>
            <div className="flex justify-end gap-x-6 items-center">
              <Link
                href="/login"
                className="text-gray-600 font-medium hover:text-blue-600 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-full transition shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
              >
                Create Shop
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-8 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Isolated Storefronts Now Available
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
            Launch Your Independent <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Online Business
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
            Register your business, get verified, and instantly launch a beautiful, isolated storefront. Manage everything from a single, powerful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white font-medium px-8 py-4 rounded-full transition shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-800 font-medium px-8 py-4 rounded-full transition hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              View Demo Store
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to scale</h2>
            <p className="text-lg text-gray-600">Built specifically for Sri Lankan businesses looking for reliable infrastructure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-blue-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">True Isolation Strategy</h3>
              <p className="text-gray-600 leading-relaxed">
                Your shop isn't just a subdomain. We physically generate a hardcoded route for maximum stability, performance, and clear data separation.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Inventory Automation</h3>
              <p className="text-gray-600 leading-relaxed">
                Never sell out unexpectedly. Set low-stock thresholds, manage multi-image products, and track real-time fulfillment statuses.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Palette className="text-purple-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1-Click Themes</h3>
              <p className="text-gray-600 leading-relaxed">
                Switch between elegant Light and Dark themes instantly through your Settings Panel. No coding or complex configuration required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30">
          <div className="absolute inset-x-0 top-0 h-[500px] w-[500px] mx-auto bg-blue-600 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to bring your business online?</h2>
          <p className="text-xl text-gray-300 mb-10">Join MyShop today to unlock your dedicated storefront and unified management dashboard.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-4 rounded-full transition shadow-lg text-lg"
            >
              Register Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <PlatformLogo variant="full" className="!h-10 grayscale opacity-80" />
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} MyShop SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
