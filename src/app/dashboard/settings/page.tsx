'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Store, Check, Palette, Type, Settings, ExternalLink, UploadCloud, X } from 'lucide-react';

const TEMPLATES = [
    {
        id: 'minimal-white',
        name: 'Minimal White',
        description: 'Clean Apple-style design. Perfect for all products.',
        preview: 'bg-white border-2',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    },
    {
        id: 'modern-dark',
        name: 'Modern Dark',
        description: 'Bold dark theme with neon accents. Ideal for tech & lifestyle.',
        preview: 'bg-gray-900 border-2',
        colors: ['#6366F1', '#EC4899', '#14B8A6', '#F97316'],
    },
    {
        id: 'vibrant-market',
        name: 'Vibrant Market',
        description: 'Colorful and energetic. Great for food, crafts, and general retail.',
        preview: 'bg-amber-50 border-2',
        colors: ['#F59E0B', '#EF4444', '#10B981', '#8B5CF6'],
    },
    {
        id: 'elegant-boutique',
        name: 'Elegant Boutique',
        description: 'Luxury serif-driven design. Perfect for fashion and premium goods.',
        preview: 'bg-stone-100 border-2',
        colors: ['#7C3AED', '#B45309', '#059669', '#DC2626'],
    },
];

const FONTS = [
    { id: 'Inter', name: 'Inter', style: 'font-sans' },
    { id: 'Merriweather', name: 'Merriweather', style: 'font-serif' },
    { id: 'Playfair Display', name: 'Playfair Display', style: 'font-serif' },
    { id: 'Poppins', name: 'Poppins', style: 'font-sans' },
    { id: 'Roboto Mono', name: 'Roboto Mono', style: 'font-mono' },
];

interface ShopSettings {
    id: string;
    shop_name: string;
    template: string;
    primary_color: string;
    font: string;
    tagline: string;
    announcement_bar: string;
    footer_text: string;
    banner_url: string;
    logo_url: string;
    route_path: string;
}

export default function DashboardSettingsPage() {
    const supabase = createClient();
    const [shop, setShop] = useState<ShopSettings | null>(null);
    const [form, setForm] = useState<Partial<ShopSettings>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [activeSection, setActiveSection] = useState<'template' | 'branding' | 'colors'>('template');

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchShop = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        if (data) {
            setShop(data);
            setForm({
                template: data.template || 'minimal-white',
                primary_color: data.primary_color || '#3B82F6',
                font: data.font || 'Inter',
                tagline: data.tagline || '',
                announcement_bar: data.announcement_bar || '',
                footer_text: data.footer_text || '',
                banner_url: data.banner_url || '',
                logo_url: data.logo_url || '',
            });
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchShop();
    }, [fetchShop]);

    const handleSave = async () => {
        if (!shop) return;
        setSaving(true);
        setSaved(false);

        await supabase
            .from('shops')
            .update(form)
            .eq('id', shop.id);

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const updateForm = (key: keyof ShopSettings, val: string) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = event.target.files?.[0];
        if (!file || !shop) return;

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${shop.id}-${type}-${Math.random()}.${fileExt}`;
            const filePath = `${shop.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('shop-assets')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('shop-assets')
                .getPublicUrl(filePath);

            updateForm(type === 'logo' ? 'logo_url' : 'banner_url', publicUrl);

            // Auto-save the new URL immediately
            await supabase.from('shops').update({
                [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl
            }).eq('id', shop.id);

        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            alert(`Failed to upload ${type}. Ensure bucket is configured.`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading your shop settings...</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen p-8">
                <div className="text-center max-w-md flex flex-col items-center">
                    <Store className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Shop Found</h2>
                    <p className="text-gray-500 mb-6">You haven't created a shop yet. Complete the business verification first.</p>
                    <a href="/onboarding" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Start Onboarding
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Storefront Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Customize how your shop looks to customers at{' '}
                        <a href={`/shop/${shop.route_path}`} target="_blank" className="text-blue-600 hover:underline">
                            /shop/{shop.route_path}
                        </a>
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${saved
                        ? 'bg-green-600 text-white'
                        : saving
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {(['template', 'branding', 'colors'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSection(tab)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeSection === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'template' ? <span className="flex items-center justify-center gap-2"><Settings className="w-4 h-4" /> Template</span> :
                            tab === 'branding' ? <span className="flex items-center justify-center gap-2"><Type className="w-4 h-4" /> Branding</span> :
                                <span className="flex items-center justify-center gap-2"><Palette className="w-4 h-4" /> Colors & Fonts</span>}
                    </button>
                ))}
            </div>

            {/* Section A: Template */}
            {activeSection === 'template' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {TEMPLATES.map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => updateForm('template', tmpl.id)}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all hover:shadow-md ${form.template === tmpl.id
                                    ? 'border-blue-600 shadow-md bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                {form.template === tmpl.id && (
                                    <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Active
                                    </span>
                                )}
                                <div className={`w-12 h-12 rounded-lg mb-3 ${tmpl.preview}`} />
                                <h3 className="font-bold text-gray-900 mb-1">{tmpl.name}</h3>
                                <p className="text-sm text-gray-500">{tmpl.description}</p>
                                <div className="flex gap-1.5 mt-3">
                                    {tmpl.colors.map(c => (
                                        <div key={c} style={{ backgroundColor: c }} className="w-5 h-5 rounded-full border border-white shadow-sm" />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Section B: Branding */}
            {activeSection === 'branding' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-gray-900">Branding & Content</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Tagline</label>
                            <input
                                type="text"
                                value={form.tagline || ''}
                                onChange={(e) => updateForm('tagline', e.target.value)}
                                placeholder="e.g. Fresh from the spice garden..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Displayed beneath your shop name in the hero section.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Announcement Bar</label>
                            <input
                                type="text"
                                value={form.announcement_bar || ''}
                                onChange={(e) => updateForm('announcement_bar', e.target.value)}
                                placeholder="e.g. Free delivery over Rs. 5000!"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Shows a colored strip at the very top of your storefront.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Message</label>
                        <input
                            type="text"
                            value={form.footer_text || ''}
                            onChange={(e) => updateForm('footer_text', e.target.value)}
                            placeholder="e.g. © 2025 Ceylon Spice House. All rights reserved."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Logo</label>

                            {form.logo_url ? (
                                <div className="relative w-32 h-32 mb-3 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                                    <img src={form.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                                    <button
                                        onClick={() => updateForm('logo_url', '')}
                                        className="absolute top-1 right-1 bg-white p-1 rounded-full text-red-500 shadow hover:bg-red-50"
                                        title="Remove Logo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-32 h-32 mb-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600"
                                >
                                    {uploadingLogo ? (
                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UploadCloud className="w-6 h-6 mb-2" />
                                            <span className="text-xs font-medium">Upload Logo</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={logoInputRef}
                                onChange={(e) => handleFileUpload(e, 'logo')}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Or use URL:</span>
                                <input
                                    type="url"
                                    value={form.logo_url || ''}
                                    onChange={(e) => updateForm('logo_url', e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Banner Image</label>

                            {form.banner_url ? (
                                <div className="relative w-full h-32 mb-3 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                                    <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => updateForm('banner_url', '')}
                                        className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500 shadow hover:bg-red-50"
                                        title="Remove Banner"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="w-full h-32 mb-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center cursor-pointer text-gray-500 hover:text-blue-600"
                                >
                                    {uploadingBanner ? (
                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UploadCloud className="w-6 h-6 mb-2" />
                                            <span className="text-xs font-medium">Upload Hero Banner</span>
                                            <span className="text-xs text-gray-400 mt-1">Recommended: 1920x600px</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={bannerInputRef}
                                onChange={(e) => handleFileUpload(e, 'banner')}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Or use URL:</span>
                                <input
                                    type="url"
                                    value={form.banner_url || ''}
                                    onChange={(e) => updateForm('banner_url', e.target.value)}
                                    placeholder="https://example.com/banner.jpg"
                                    className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section C: Colors & Fonts */}
            {activeSection === 'colors' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Colors & Typography</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
                        <div className="flex items-center gap-4 flex-wrap">
                            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#D97706'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => updateForm('primary_color', c)}
                                    style={{ backgroundColor: c }}
                                    className={`w-9 h-9 rounded-full border-4 transition-all ${form.primary_color === c ? 'border-gray-900 scale-110' : 'border-white shadow-md hover:scale-105'
                                        }`}
                                />
                            ))}
                            <div className="flex items-center gap-2 ml-2">
                                <label className="text-sm text-gray-500">Custom:</label>
                                <input
                                    type="color"
                                    value={form.primary_color || '#3B82F6'}
                                    onChange={(e) => updateForm('primary_color', e.target.value)}
                                    className="w-9 h-9 rounded-full border-2 border-gray-200 cursor-pointer overflow-hidden"
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <div style={{ backgroundColor: form.primary_color || '#3B82F6' }} className="w-10 h-10 rounded-lg" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Current: {form.primary_color}</p>
                                <p className="text-xs text-gray-400">Used for buttons, accents, and highlights across your storefront.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {FONTS.map(font => (
                                <button
                                    key={font.id}
                                    onClick={() => updateForm('font', font.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.font === font.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <p className={`text-lg ${font.style} font-bold text-gray-900`}>{font.name}</p>
                                    <p className={`text-xs text-gray-500 ${font.style} mt-1`}>The quick brown fox</p>
                                    {form.font === font.id && <span className="text-xs text-blue-600 font-medium block mt-1">Selected ✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Live Preview Link */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-blue-900">Preview Your Storefront</p>
                    <p className="text-xs text-blue-600 mt-0.5">Remember to save changes before previewing!</p>
                </div>
                <a
                    href={`/shop/${shop.route_path}`}
                    target="_blank"
                    className="bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <span>Open Shop</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
