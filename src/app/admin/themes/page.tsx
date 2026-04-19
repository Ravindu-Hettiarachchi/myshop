'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Paintbrush, Plus, Trash2, ToggleLeft, ToggleRight, X,
    Info, ChevronDown, ChevronUp, Code2, Wand2, Check,
    Palette, Type, Layout, Square, Monitor, Footprints
} from 'lucide-react';
import { getRegisteredSlugs } from '@/lib/themes';

interface Theme {
    id: string; slug: string; name: string; description: string;
    preview_color: string; is_active: boolean;
    theme_type: 'coded' | 'custom';
    bg_color: string; text_color: string; accent_color: string;
    secondary_color: string; card_bg_color: string; footer_bg: string;
    font_family: string; heading_font: string; body_size: string;
    layout_style: string; card_style: string; header_style: string;
    button_style: string; button_radius: string;
    card_image_ratio: string; card_hover: string; show_description: boolean;
    hero_style: string; spacing_scale: string; sticky_header: boolean;
    footer_style: string; created_at: string;
}

const EMPTY_CODED = { slug: '', name: '', description: '', preview_color: '#3B82F6', is_active: true };

const EMPTY_CUSTOM = {
    name: '', description: '', is_active: true,
    bg_color: '#FFFFFF', text_color: '#111111', accent_color: '#3B82F6',
    secondary_color: '#6366F1', card_bg_color: '#FFFFFF', footer_bg: 'page',
    font_family: 'Inter', heading_font: 'Inter', body_size: 'md',
    layout_style: 'minimal', hero_style: 'compact', spacing_scale: 'normal',
    sticky_header: true,
    header_style: 'minimal',
    card_style: 'rounded', card_image_ratio: 'square', card_hover: 'scale', show_description: true,
    button_style: 'filled', button_radius: 'md',
    footer_style: 'minimal',
};

const FONTS = ['Inter', 'Playfair Display', 'Poppins', 'Roboto Mono', 'Merriweather', 'Lato', 'Nunito', 'DM Sans'];

const OPT = {
    layout:      [{ v: 'minimal', l: 'Minimal', d: 'Clean 3-col grid' }, { v: 'grid', l: 'Grid', d: 'Dense 4-col' }, { v: 'bold', l: 'Bold', d: 'Large hero + grid' }],
    card:        [{ v: 'rounded', l: 'Rounded', d: 'Soft + light shadow' }, { v: 'sharp', l: 'Sharp', d: 'Flat & minimal' }, { v: 'elevated', l: 'Elevated', d: 'Deep shadow' }],
    header:      [{ v: 'minimal', l: 'Minimal', d: 'White, left logo' }, { v: 'centered', l: 'Centered', d: 'Centered logo' }, { v: 'colored', l: 'Colored', d: 'Accent background' }],
    hero:        [{ v: 'none', l: 'None', d: 'No hero section' }, { v: 'compact', l: 'Compact', d: 'Small tagline bar' }, { v: 'full', l: 'Full', d: 'Large banner hero' }],
    spacing:     [{ v: 'compact', l: 'Compact', d: 'Tight spacing' }, { v: 'normal', l: 'Normal', d: 'Balanced spacing' }, { v: 'spacious', l: 'Spacious', d: 'Airy spacing' }],
    btnStyle:    [{ v: 'filled', l: 'Filled', d: 'Solid accent color' }, { v: 'outline', l: 'Outline', d: 'Border only' }, { v: 'soft', l: 'Soft', d: 'Tinted fill' }],
    btnRadius:   [{ v: 'none', l: 'Sharp', d: '0px radius' }, { v: 'sm', l: 'Small', d: '6px radius' }, { v: 'md', l: 'Medium', d: '10px radius' }, { v: 'lg', l: 'Large', d: '14px radius' }, { v: 'pill', l: 'Pill', d: 'Full rounded' }],
    imgRatio:    [{ v: 'square', l: 'Square', d: '1:1' }, { v: 'portrait', l: 'Portrait', d: '3:4' }, { v: 'landscape', l: 'Landscape', d: '4:3' }],
    hover:       [{ v: 'none', l: 'None', d: 'No hover effect' }, { v: 'scale', l: 'Scale', d: 'Zoom image' }, { v: 'shadow', l: 'Shadow', d: 'Deeper shadow' }, { v: 'both', l: 'Both', d: 'Scale + shadow' }],
    footerStyle: [{ v: 'minimal', l: 'Minimal', d: 'Single line' }, { v: 'centered', l: 'Centered', d: 'Centered logo' }, { v: 'rich', l: 'Rich', d: '3-column footer' }],
    footerBg:    [{ v: 'page', l: 'Page Color', d: 'Same as background' }, { v: 'dark', l: 'Dark', d: 'Dark #111' }, { v: 'accent', l: 'Accent', d: 'Accent color' }],
};

// ─── Sub-components ───────────────────────────────────────────
function RadioCard({ v, current, onChange, l, d }: { v: string; current: string; onChange: (x: string) => void; l: string; d: string }) {
    const sel = v === current;
    return (
        <button type="button" onClick={() => onChange(v)}
            className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${sel ? 'border-red-600 bg-red-900/20' : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'}`}>
            <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-red-500' : 'border-gray-600'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <span className={`font-semibold text-xs ${sel ? 'text-red-300' : 'text-gray-300'}`}>{l}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-5 leading-tight">{d}</p>
        </button>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded-lg border-none cursor-pointer flex-shrink-0 bg-transparent" />
                <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-2.5 py-2 rounded-lg border border-gray-700 font-mono text-xs bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
            </div>
        </div>
    );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-800/50 rounded-2xl p-5 space-y-4 border border-gray-700">
            <p className="text-sm font-bold text-gray-200 flex items-center gap-2">{icon}{title}</p>
            {children}
        </div>
    );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <button type="button" onClick={() => onChange(!value)} className="flex-shrink-0">
                {value ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-600" />}
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminThemesPage() {
    const supabase = createClient();
    const [themes, setThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [themeType, setThemeType] = useState<'coded' | 'custom'>('coded');
    const [codedForm, setCodedForm] = useState(EMPTY_CODED);
    const [customForm, setCustomForm] = useState(EMPTY_CUSTOM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showHint, setShowHint] = useState(false);
    const registeredSlugs = getRegisteredSlugs();

    const fetchThemes = useCallback(async () => {
        const { data } = await supabase.from('themes').select('*').order('created_at', { ascending: true });
        setThemes((data || []) as Theme[]);
        setLoading(false);
    }, [supabase]);

     
    useEffect(() => {
        const load = async () => { await fetchThemes(); };
        load();
    }, [fetchThemes]);

    const set = (key: string, val: string | number | boolean) => setCustomForm(f => ({ ...f, [key]: val }));

    const handleToggle = async (theme: Theme) => {
        const updated = !theme.is_active;
        await supabase.from('themes').update({ is_active: updated }).eq('id', theme.id);
        setThemes(prev => prev.map(t => t.id === theme.id ? { ...t, is_active: updated } : t));
    };

    const handleDelete = async (theme: Theme) => {
        if (!confirm(`Delete "${theme.name}"? Shops already using it will fall back to the default theme.`)) return;
        await supabase.from('themes').delete().eq('id', theme.id);
        setThemes(prev => prev.filter(t => t.id !== theme.id));
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (themeType === 'coded') {
            if (!codedForm.slug.trim() || !codedForm.name.trim()) { setError('Slug and name are required.'); return; }
            setSaving(true);
            const { error: dbErr } = await supabase.from('themes').insert({
                slug: codedForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
                name: codedForm.name.trim(), description: codedForm.description.trim(),
                preview_color: codedForm.preview_color, is_active: codedForm.is_active, theme_type: 'coded',
            });
            setSaving(false);
            if (dbErr) { setError(dbErr.message.includes('unique') ? 'A theme with that slug already exists.' : dbErr.message); return; }
        } else {
            if (!customForm.name.trim()) { setError('Theme Name is required.'); return; }
            setSaving(true);
            const slug = customForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);
            const { error: dbErr } = await supabase.from('themes').insert({
                slug, name: customForm.name.trim(), description: customForm.description.trim(),
                preview_color: customForm.accent_color, is_active: customForm.is_active, theme_type: 'custom',
                bg_color: customForm.bg_color, text_color: customForm.text_color, accent_color: customForm.accent_color,
                secondary_color: customForm.secondary_color, card_bg_color: customForm.card_bg_color, footer_bg: customForm.footer_bg,
                font_family: customForm.font_family, heading_font: customForm.heading_font, body_size: customForm.body_size,
                layout_style: customForm.layout_style, hero_style: customForm.hero_style,
                spacing_scale: customForm.spacing_scale, sticky_header: customForm.sticky_header,
                header_style: customForm.header_style,
                card_style: customForm.card_style, card_image_ratio: customForm.card_image_ratio,
                card_hover: customForm.card_hover, show_description: customForm.show_description,
                button_style: customForm.button_style, button_radius: customForm.button_radius,
                footer_style: customForm.footer_style,
            });
            setSaving(false);
            if (dbErr) { setError(dbErr.message); return; }
        }
        setCodedForm(EMPTY_CODED);
        setCustomForm(EMPTY_CUSTOM);
        setShowForm(false);
        fetchThemes();
    };

    const c = customForm;
    const activeCount = themes.filter(t => t.is_active).length;

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto text-white">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
                        <Paintbrush className="w-8 h-8 text-red-500" /> Theme Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Control storefront themes visible to shop owners.&nbsp;
                        <span className="font-semibold text-gray-300">{activeCount} active</span> / {themes.length} total
                    </p>
                </div>
                <button onClick={() => { setShowForm(v => !v); setError(''); }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm">
                    {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Theme</>}
                </button>
            </div>

            {/* ── Developer Hint ── */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl overflow-hidden">
                <button onClick={() => setShowHint(v => !v)}
                    className="w-full flex items-center gap-2 px-5 py-3 text-blue-300 hover:bg-blue-900/30 transition text-sm font-semibold">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span>Developer Info — Coded theme slugs registered in code</span>
                    {showHint ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </button>
                {showHint && (
                    <div className="px-5 pb-4 pt-1 border-t border-blue-800/40">
                        <p className="text-sm text-blue-400 mb-3">
                            These slugs are registered in <code className="bg-blue-900/40 px-1.5 py-0.5 rounded font-mono text-xs">src/lib/themes.ts</code>.
                            Click one to pre-fill the Coded form.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {registeredSlugs.map(slug => (
                                <button key={slug} onClick={() => { setCodedForm(f => ({ ...f, slug })); setThemeType('coded'); setShowForm(true); }}
                                    className="font-mono text-xs bg-gray-800 border border-blue-700/60 text-blue-300 px-3 py-1 rounded-lg hover:border-blue-500 transition">
                                    {slug}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Theme Form ── */}
            {showForm && (
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-6">
                    {/* Type Toggle */}
                    <div>
                        <p className="text-sm font-semibold text-gray-300 mb-3">Theme Type</p>
                        <div className="flex gap-3">
                            {[
                                { type: 'coded' as const, Icon: Code2, label: 'Coded Theme', desc: 'Links to a developer .tsx component', activeClass: 'border-blue-600 bg-blue-900/20', activeIcon: 'text-blue-400', activeText: 'text-blue-300' },
                                { type: 'custom' as const, Icon: Wand2, label: 'Custom Builder', desc: 'Design visually — no code needed', activeClass: 'border-purple-600 bg-purple-900/20', activeIcon: 'text-purple-400', activeText: 'text-purple-300' },
                            ].map(({ type, Icon, label, desc, activeClass, activeIcon, activeText }) => (
                                <button key={type} type="button" onClick={() => setThemeType(type)}
                                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${themeType === type ? activeClass : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'}`}>
                                    <Icon className={`w-5 h-5 ${themeType === type ? activeIcon : 'text-gray-500'}`} />
                                    <div className="text-left">
                                        <p className={`font-bold text-sm ${themeType === type ? activeText : 'text-gray-300'}`}>{label}</p>
                                        <p className="text-xs text-gray-500">{desc}</p>
                                    </div>
                                    {themeType === type && <Check className={`w-4 h-4 ${activeIcon} ml-auto`} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-red-400 bg-red-900/30 border border-red-800/60 rounded-xl px-4 py-3 text-sm">{error}</p>}

                    <form onSubmit={handleAdd} className="space-y-5">

                        {/* ── CODED ── */}
                        {themeType === 'coded' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Slug <span className="text-red-500">*</span></label>
                                        <input value={codedForm.slug} onChange={e => setCodedForm(f => ({ ...f, slug: e.target.value }))}
                                            placeholder="e.g. minimal-white"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                        <p className="text-xs text-gray-600 mt-1">Must match a key in <code>src/lib/themes.ts</code></p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Display Name <span className="text-red-500">*</span></label>
                                        <input value={codedForm.name} onChange={e => setCodedForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. Minimal White"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                    </div>
                                </div>
                                <input value={codedForm.description} onChange={e => setCodedForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Short description"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                <div className="flex items-center gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Preview Color</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={codedForm.preview_color} onChange={e => setCodedForm(f => ({ ...f, preview_color: e.target.value }))} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent" />
                                            <input type="text" value={codedForm.preview_color} onChange={e => setCodedForm(f => ({ ...f, preview_color: e.target.value }))} className="w-28 px-3 py-2 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 font-mono text-sm" />
                                        </div>
                                    </div>
                                    <div className="mt-5">
                                        <Toggle label="Active on creation" value={codedForm.is_active} onChange={v => setCodedForm(f => ({ ...f, is_active: v }))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── CUSTOM BUILDER ── */}
                        {themeType === 'custom' && (
                            <div className="space-y-5">
                                {/* Identity */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Theme Name <span className="text-red-500">*</span></label>
                                        <input value={c.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ocean Breeze"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                        <p className="text-xs text-gray-600 mt-1">Slug is auto-generated</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                        <input value={c.description} onChange={e => set('description', e.target.value)} placeholder="Short description for shop owners"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div style={{ backgroundColor: c.bg_color, borderColor: c.accent_color + '50' }} className="rounded-2xl border-2 p-4 overflow-hidden">
                                    <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Live Preview</p>
                                    {/* Mini Header */}
                                    <div style={{ backgroundColor: c.header_style === 'colored' ? c.accent_color : c.bg_color, borderBottom: `1px solid ${c.text_color}15` }} className="rounded-xl px-4 py-2.5 flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div style={{ background: c.accent_color, borderRadius: c.button_radius === 'pill' ? '999px' : c.button_radius === 'none' ? '0' : '6px' }} className="w-5 h-5 flex items-center justify-center text-white text-xs font-bold">S</div>
                                            <span style={{ color: c.header_style === 'colored' ? '#fff' : c.text_color, fontFamily: c.heading_font }} className="font-bold text-xs">Shop Name</span>
                                        </div>
                                        <div style={{ background: c.button_style === 'filled' ? c.accent_color : 'transparent', border: c.button_style === 'outline' ? `1.5px solid ${c.header_style === 'colored' ? '#fff' : c.accent_color}` : 'none', color: c.button_style === 'filled' ? '#fff' : c.accent_color, borderRadius: c.button_radius === 'pill' ? '999px' : c.button_radius === 'none' ? '0' : '6px' }} className="text-xs px-2 py-0.5 font-bold">Login</div>
                                    </div>
                                    {/* Hero stub */}
                                    {c.hero_style !== 'none' && (
                                        <div style={{ background: `linear-gradient(135deg, ${c.accent_color}18, ${c.secondary_color}10)`, height: c.hero_style === 'full' ? '48px' : '28px', borderRadius: '8px' }} className="mb-3 flex items-center px-3">
                                            <span style={{ color: c.text_color, fontFamily: c.heading_font }} className="text-xs font-extrabold">Shop Name</span>
                                        </div>
                                    )}
                                    {/* Mini cards */}
                                    <div className={`grid gap-2 ${c.layout_style === 'grid' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                        {Array.from({ length: c.layout_style === 'grid' ? 4 : 3 }).map((_, i) => (
                                            <div key={i} style={{
                                                backgroundColor: c.card_bg_color,
                                                borderRadius: c.card_style === 'sharp' ? '2px' : c.card_style === 'elevated' ? '12px' : '8px',
                                                boxShadow: c.card_style === 'elevated' ? '0 4px 16px rgba(0,0,0,0.11)' : '0 1px 4px rgba(0,0,0,0.06)',
                                                border: `1px solid ${c.text_color}10`,
                                            }} className="overflow-hidden">
                                                <div style={{ backgroundColor: c.secondary_color + '30', aspectRatio: c.card_image_ratio === 'portrait' ? '3/4' : c.card_image_ratio === 'landscape' ? '4/3' : '1/1' }} />
                                                <div className="p-1.5">
                                                    <div style={{ backgroundColor: c.text_color + '20', height: '6px', borderRadius: '3px' }} className="mb-1" />
                                                    <div style={{ background: c.button_style === 'filled' ? c.accent_color : 'transparent', border: c.button_style === 'outline' ? `1.5px solid ${c.accent_color}` : 'none', borderRadius: c.button_radius === 'pill' ? '999px' : '4px' }} className="h-4 flex items-center justify-center">
                                                        <span style={{ fontSize: '8px', fontWeight: 700, color: c.button_style === 'filled' ? '#fff' : c.accent_color }}>Add</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Footer stub */}
                                    <div style={{ backgroundColor: c.footer_bg === 'dark' ? '#111' : c.footer_bg === 'accent' ? c.accent_color : c.bg_color, borderTop: `1px solid ${c.text_color}10`, marginTop: '10px', borderRadius: '8px' }} className="px-3 py-2 flex justify-between items-center">
                                        <span style={{ color: c.footer_bg !== 'page' ? '#fff' : c.text_color, fontFamily: c.heading_font, fontSize: '9px', fontWeight: 700 }}>Shop Name</span>
                                        <span style={{ color: c.footer_bg !== 'page' ? 'rgba(255,255,255,0.5)' : `${c.text_color}60`, fontSize: '8px' }}>© 2025</span>
                                    </div>
                                </div>

                                {/* ── Section 1: Colors ── */}
                                <Section icon={<Palette className="w-4 h-4 text-red-400" />} title="Colors">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <ColorField label="Background" value={c.bg_color} onChange={v => set('bg_color', v)} />
                                        <ColorField label="Body Text" value={c.text_color} onChange={v => set('text_color', v)} />
                                        <ColorField label="Accent (Primary)" value={c.accent_color} onChange={v => set('accent_color', v)} />
                                        <ColorField label="Secondary" value={c.secondary_color} onChange={v => set('secondary_color', v)} />
                                        <ColorField label="Card Background" value={c.card_bg_color} onChange={v => set('card_bg_color', v)} />
                                    </div>
                                </Section>

                                {/* ── Section 2: Typography ── */}
                                <Section icon={<Type className="w-4 h-4 text-red-400" />} title="Typography">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Body Font</label>
                                            <select value={c.font_family} onChange={e => set('font_family', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                                                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Heading Font</label>
                                            <select value={c.heading_font} onChange={e => set('heading_font', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                                                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-2">Body Size</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[{ v: 'sm', l: 'S' }, { v: 'md', l: 'M' }, { v: 'lg', l: 'L' }].map(o => (
                                                    <button key={o.v} type="button" onClick={() => set('body_size', o.v)}
                                                        className={`py-2 rounded-xl border-2 font-bold text-sm transition ${c.body_size === o.v ? 'border-red-600 bg-red-900/20 text-red-300' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}>
                                                        {o.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Section>

                                {/* ── Section 3: Layout ── */}
                                <Section icon={<Layout className="w-4 h-4 text-red-400" />} title="Layout & Spacing">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Product Grid Layout</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.layout.map(o => <RadioCard key={o.v} v={o.v} current={c.layout_style} onChange={v => set('layout_style', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Hero Section</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.hero.map(o => <RadioCard key={o.v} v={o.v} current={c.hero_style} onChange={v => set('hero_style', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Spacing Scale</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.spacing.map(o => <RadioCard key={o.v} v={o.v} current={c.spacing_scale} onChange={v => set('spacing_scale', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                    </div>
                                </Section>

                                {/* ── Section 4: Header ── */}
                                <Section icon={<Monitor className="w-4 h-4 text-red-400" />} title="Header">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 mb-2">Header Style</p>
                                        <div className="grid grid-cols-3 gap-2">{OPT.header.map(o => <RadioCard key={o.v} v={o.v} current={c.header_style} onChange={v => set('header_style', v)} l={o.l} d={o.d} />)}</div>
                                    </div>
                                    <Toggle label="Sticky header (stays on scroll)" value={c.sticky_header} onChange={v => set('sticky_header', v)} />
                                </Section>

                                {/* ── Section 5: Cards ── */}
                                <Section icon={<Square className="w-4 h-4 text-red-400" />} title="Product Cards">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Card Shape</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.card.map(o => <RadioCard key={o.v} v={o.v} current={c.card_style} onChange={v => set('card_style', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Image Ratio</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.imgRatio.map(o => <RadioCard key={o.v} v={o.v} current={c.card_image_ratio} onChange={v => set('card_image_ratio', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Hover Effect</p>
                                            <div className="grid grid-cols-4 gap-2">{OPT.hover.map(o => <RadioCard key={o.v} v={o.v} current={c.card_hover} onChange={v => set('card_hover', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <Toggle label="Show product description on cards" value={c.show_description} onChange={v => set('show_description', v)} />
                                    </div>
                                </Section>

                                {/* ── Section 6: Buttons ── */}
                                <Section icon={<Check className="w-4 h-4 text-red-400" />} title="Buttons">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Button Style</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.btnStyle.map(o => <RadioCard key={o.v} v={o.v} current={c.button_style} onChange={v => set('button_style', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Border Radius</p>
                                            <div className="grid grid-cols-5 gap-2">{OPT.btnRadius.map(o => <RadioCard key={o.v} v={o.v} current={c.button_radius} onChange={v => set('button_radius', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        {/* Live button preview */}
                                        <div className="flex gap-3 flex-wrap items-center">
                                            <button type="button" style={{ background: c.button_style === 'filled' ? c.accent_color : c.button_style === 'soft' ? c.accent_color + '20' : 'transparent', color: c.button_style === 'filled' ? '#fff' : c.accent_color, border: c.button_style === 'outline' ? `2px solid ${c.accent_color}` : 'none', borderRadius: c.button_radius === 'pill' ? '9999px' : c.button_radius === 'none' ? '0' : c.button_radius === 'sm' ? '6px' : c.button_radius === 'lg' ? '14px' : '10px', fontFamily: c.font_family }} className="px-5 py-2 font-bold text-sm">Add to Cart</button>
                                            <span className="text-xs text-gray-500">← Button preview</span>
                                        </div>
                                    </div>
                                </Section>

                                {/* ── Section 7: Footer ── */}
                                <Section icon={<Footprints className="w-4 h-4 text-red-400" />} title="Footer">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Footer Layout</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.footerStyle.map(o => <RadioCard key={o.v} v={o.v} current={c.footer_style} onChange={v => set('footer_style', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 mb-2">Footer Background</p>
                                            <div className="grid grid-cols-3 gap-2">{OPT.footerBg.map(o => <RadioCard key={o.v} v={o.v} current={c.footer_bg} onChange={v => set('footer_bg', v)} l={o.l} d={o.d} />)}</div>
                                        </div>
                                    </div>
                                </Section>

                                <Toggle label="Active on creation (visible to shop owners)" value={c.is_active} onChange={v => set('is_active', v)} />
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={saving}
                                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white transition shadow-sm disabled:opacity-50 bg-red-600 hover:bg-red-700">
                                {saving ? 'Saving...' : themeType === 'custom' ? 'Create Custom Theme' : 'Add Coded Theme'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Themes List ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-800 bg-gray-800/30">
                    <h2 className="font-bold text-white">All Themes</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Disabling a theme hides it from shop owners. Existing shops keep rendering their chosen theme.</p>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center">
                        <div className="w-8 h-8 border-4 border-gray-800 border-t-red-500 rounded-full animate-spin" />
                    </div>
                ) : themes.length === 0 ? (
                    <div className="py-20 flex flex-col items-center text-gray-600">
                        <Paintbrush className="w-12 h-12 mb-3 opacity-30" />
                        <p className="font-medium text-gray-400">No themes yet.</p>
                        <p className="text-sm mt-1 text-gray-600">Run <code className="bg-gray-800 px-1.5 rounded text-xs">database/themes_migration.sql</code> to seed defaults.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-800">
                        {themes.map(theme => {
                            const isCustom = theme.theme_type === 'custom';
                            const inRegistry = registeredSlugs.includes(theme.slug);
                            return (
                                <li key={theme.id} className={`px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${theme.is_active ? 'hover:bg-gray-800/40' : 'opacity-50 bg-gray-800/10'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex-shrink-0 border-2 border-gray-700 shadow-md" style={{ background: theme.preview_color || theme.accent_color || '#3B82F6' }} />
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-white">{theme.name}</p>
                                                {isCustom
                                                    ? <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full flex items-center gap-1"><Wand2 className="w-3 h-3" /> Custom</span>
                                                    : <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded-full flex items-center gap-1"><Code2 className="w-3 h-3" /> Coded</span>
                                                }
                                                {!isCustom && !inRegistry && <span className="text-xs bg-amber-900/30 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full">⚠ Not in registry</span>}
                                                {!theme.is_active && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Disabled</span>}
                                            </div>
                                            {theme.description && <p className="text-sm text-gray-500 mt-0.5">{theme.description}</p>}
                                            {isCustom && (
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {[theme.bg_color, theme.text_color, theme.accent_color, theme.secondary_color].map((col, i) => col && (
                                                        <div key={i} className="w-4 h-4 rounded-full border border-gray-700 shadow-sm" style={{ background: col }} />
                                                    ))}
                                                    <span className="text-xs text-gray-600">{theme.font_family} · {theme.layout_style} · {theme.card_style} · {theme.button_style}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => handleToggle(theme)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition">
                                            {theme.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                                            {theme.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button onClick={() => handleDelete(theme)} className="p-2.5 rounded-xl border border-gray-700 text-gray-600 hover:text-red-400 hover:border-red-800/60 hover:bg-red-900/20 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
