'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Store, Palette, Type, Settings, ExternalLink, UploadCloud, X, ImageIcon } from 'lucide-react';
import { buildStorefrontUrl } from '@/lib/storefront';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';

// Themes are now loaded from the database (managed by the admin panel)

const FONTS = [
    { id: 'Inter', name: 'Inter', style: 'font-sans' },
    { id: 'Merriweather', name: 'Merriweather', style: 'font-serif' },
    { id: 'Playfair Display', name: 'Playfair Display', style: 'font-serif' },
    { id: 'Poppins', name: 'Poppins', style: 'font-sans' },
    { id: 'Roboto Mono', name: 'Roboto Mono', style: 'font-mono' },
];

const SETTINGS_TABS: Array<'General' | 'Theme' | 'Invoice'> = ['General', 'Theme', 'Invoice'];

interface DbTheme {
    id: string;
    slug: string;
    name: string;
    description: string;
    preview_color: string;
    is_active: boolean;
}

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
    company_address: string;
    invoice_notes: string;
    tax_rate: number;
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
    const [activeTab, setActiveTab] = useState<'General' | 'Theme' | 'Invoice'>('General');
    const [availableThemes, setAvailableThemes] = useState<DbTheme[]>([]);
    const [loadingThemes, setLoadingThemes] = useState(true);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const fetchShop = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data }, { data: themesData }] = await Promise.all([
            supabase.from('shops').select('*').eq('owner_id', user.id).single(),
            supabase.from('themes').select('*').eq('is_active', true).order('created_at', { ascending: true }),
        ]);

        if (themesData) setAvailableThemes(themesData);
        setLoadingThemes(false);

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
                company_address: data.company_address || '',
                invoice_notes: data.invoice_notes || '',
                tax_rate: data.tax_rate || 0,
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

    const updateForm = (key: keyof ShopSettings, val: string | number) => {
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

            const { publicUrl } = await uploadToShopAssets({
                supabase,
                file,
                filePath,
                upsert: true,
            });

            updateForm(type === 'logo' ? 'logo_url' : 'banner_url', publicUrl);

            // Auto-save the new URL immediately
            await supabase.from('shops').update({
                [type === 'logo' ? 'logo_url' : 'banner_url']: publicUrl
            }).eq('id', shop.id);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : `Failed to upload ${type}.`;
            console.error(`Error uploading ${type}:`, message);
            alert(message);
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
                    <p className="text-gray-500 mb-6">You haven&apos;t created a shop yet. Complete the business verification first.</p>
                    <a href="/onboarding" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Start Onboarding
                    </a>
                </div>
            </div>
        );
    }

    const storefrontUrl = buildStorefrontUrl(shop.route_path);

    return (
        <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Storefront Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Customize how your shop looks to customers at{' '}
                        <a href={storefrontUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-100 mb-8 overflow-x-auto">
                {SETTINGS_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                    >
                        {tab} Settings
                    </button>
                ))}
            </div>

            <div className="space-y-8 max-w-3xl">
                {activeTab === 'General' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6">

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Shop Logo & Banner</h3>
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                {/* Logo Box */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Logo</label>
                                    <div className="w-32 h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                                        {form.logo_url ? (
                                            <>
                                                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <label className="cursor-pointer bg-white text-gray-900 p-2 rounded-full shadow hover:scale-105 transition">
                                                        <ImageIcon className="w-4 h-4" />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                                                    </label>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center w-full h-full justify-center text-gray-400 hover:text-blue-600 transition">
                                                {uploadingLogo ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <>
                                                    <UploadCloud className="w-6 h-6 mb-2" />
                                                    <span className="text-xs font-medium">Upload Logo</span>
                                                </>}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Or URL:</span>
                                        <input
                                            type="url"
                                            value={form.logo_url || ''}
                                            onChange={(e) => updateForm('logo_url', e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-900 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Banner Box */}
                                <div className="space-y-3 flex-1 flex-col flex">
                                    <label className="block text-sm font-medium text-gray-700">Cover Banner</label>
                                    <div className="w-full h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                        {form.banner_url ? (
                                            <>
                                                <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow hover:scale-105 transition flex items-center gap-2">
                                                        <UploadCloud className="w-4 h-4" /> Change Banner
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} disabled={uploadingBanner} />
                                                    </label>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-600 transition">
                                                {uploadingBanner ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <>
                                                    <ImageIcon className="w-6 h-6 mb-2" />
                                                    <span className="text-xs font-medium">Upload Cover Image</span>
                                                </>}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} disabled={uploadingBanner} />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Recommended: 1200x400px</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                                <input
                                    type="text"
                                    value={form.tagline || ''}
                                    onChange={(e) => updateForm('tagline', e.target.value)}
                                    placeholder="e.g., Premium spices sourced directly from local farmers."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Top Announcement Bar</label>
                                <input
                                    type="text"
                                    value={form.announcement_bar || ''}
                                    onChange={(e) => updateForm('announcement_bar', e.target.value)}
                                    placeholder="e.g., Free delivery islandwide for orders above Rs. 5000!"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                                <textarea
                                    value={form.footer_text || ''}
                                    onChange={(e) => updateForm('footer_text', e.target.value)}
                                    placeholder="e.g., Copyright 2026. Returns accepted within 7 days."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                                />
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'Theme' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Palette className="text-gray-400 w-5 h-5" /> Base Template
                            </h3>
                            {loadingThemes ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-7 h-7 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            ) : availableThemes.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="font-medium">No themes available</p>
                                    <p className="mt-1">Ask your platform admin to activate themes.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {availableThemes.map(t => (
                                        <div
                                            key={t.slug}
                                            onClick={() => updateForm('template', t.slug)}
                                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center gap-4 ${
                                                form.template === t.slug
                                                    ? 'border-blue-600 bg-blue-50/30'
                                                    : 'border-gray-100 hover:border-blue-200 bg-gray-50/50'
                                            }`}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm"
                                                style={{ background: t.preview_color }}
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                                {t.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.description}</p>
                                                )}
                                            </div>
                                            {form.template === t.slug && (
                                                <span className="ml-auto text-blue-600 text-xs font-bold">✓ Selected</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Type className="text-gray-400 w-5 h-5" /> Typography & Color
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color (Hex)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={form.primary_color || '#3B82F6'}
                                            onChange={(e) => updateForm('primary_color', e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={form.primary_color || '#3B82F6'}
                                            onChange={(e) => updateForm('primary_color', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font Lineage</label>
                                    <select
                                        value={form.font || 'Inter'}
                                        onChange={(e) => updateForm('font', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none bg-white"
                                    >
                                        <option value="Inter">Inter (Sans-Serif)</option>
                                        <option value="serif">Playfair (Serif)</option>
                                        <option value="mono">Space Mono (Monospace)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Invoice' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Invoice PDF Configuration</h3>
                            <p className="text-sm text-gray-500 mb-6">Customize the information appearing on automated customer receipts and PDF invoices.</p>

                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 font-medium mb-1.5">Company Operating Address</label>
                                        <textarea
                                            value={form.company_address || ''}
                                            onChange={(e) => updateForm('company_address', e.target.value)}
                                            placeholder="123 Example Street, Colombo 03, Sri Lanka"
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 font-medium mb-1.5">Invoice Notes / Legal Text</label>
                                        <textarea
                                            value={form.invoice_notes || ''}
                                            onChange={(e) => updateForm('invoice_notes', e.target.value)}
                                            placeholder="Thank you for your business. Terms and conditions apply."
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1.5 flex justify-between">
                                            <span>Default Tax Rate (%)</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.tax_rate || 0}
                                            onChange={(e) => updateForm('tax_rate', parseFloat(e.target.value) || 0)}
                                            placeholder="18.00"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Live Preview Link */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between mt-8 max-w-3xl">
                <div>
                    <p className="text-sm font-semibold text-blue-900">Preview Your Storefront</p>
                    <p className="text-xs text-blue-600 mt-0.5">Remember to save changes before previewing!</p>
                </div>
                <a
                    href={storefrontUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <span>Open Shop</span>
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
