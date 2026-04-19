'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    BarChart3, AlertTriangle, CheckCircle2, XCircle, Plus, Minus,
    RefreshCw, PackageOpen, Search, X, Loader2, Bell, TrendingDown
} from 'lucide-react';

export default function InventoryPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<any[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
        if (shop) {
            setShopId(shop.id);
            const { data } = await supabase
                .from('products')
                .select('id, title, stock_quantity, low_stock_threshold, price, image_urls')
                .eq('shop_id', shop.id)
                .order('stock_quantity', { ascending: true });
            if (data) {
                setProducts(data);
                const vals: Record<string, string> = {};
                data.forEach((p: any) => { vals[p.id] = String(p.stock_quantity); });
                setInputValues(vals);
            }
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const saveStock = async (productId: string, newQty: number) => {
        if (isNaN(newQty) || newQty < 0) return;
        setSaving(s => ({ ...s, [productId]: true }));
        await supabase.from('products').update({
            stock_quantity: newQty,
            updated_at: new Date().toISOString()
        }).eq('id', productId);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: newQty } : p));
        setSaving(s => ({ ...s, [productId]: false }));
        setSavedFlash(f => ({ ...f, [productId]: true }));
        setTimeout(() => setSavedFlash(f => ({ ...f, [productId]: false })), 2000);
    };

    const handleAdjust = (productId: string, delta: number) => {
        const cur = products.find(p => p.id === productId);
        if (!cur) return;
        const newQty = Math.max(0, cur.stock_quantity + delta);
        setInputValues(v => ({ ...v, [productId]: String(newQty) }));
        saveStock(productId, newQty);
    };

    const handleInputChange = (productId: string, val: string) => {
        setInputValues(v => ({ ...v, [productId]: val }));
    };

    const handleInputBlur = (productId: string) => {
        const raw = inputValues[productId];
        const newQty = Math.max(0, parseInt(raw) || 0);
        setInputValues(v => ({ ...v, [productId]: String(newQty) }));
        saveStock(productId, newQty);
    };

    const outOfStock = products.filter(p => p.stock_quantity === 0);
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5));
    const inStock = products.filter(p => p.stock_quantity > (p.low_stock_threshold || 5));

    const filtered = products.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        if (filter === 'out') return matchSearch && p.stock_quantity === 0;
        if (filter === 'low') return matchSearch && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
        return matchSearch;
    });

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        Inventory
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage stock levels and get alerted on low inventory</p>
                </div>
                <button
                    onClick={fetchProducts}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition shadow-sm"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'In Stock', value: inStock.length, color: 'emerald', icon: CheckCircle2, desc: 'Healthy levels' },
                    { label: 'Low Stock', value: lowStock.length, color: 'orange', icon: TrendingDown, desc: 'Needs attention' },
                    { label: 'Out of Stock', value: outOfStock.length, color: 'red', icon: XCircle, desc: 'Restock urgently' },
                ].map(s => (
                    <button
                        key={s.label}
                        onClick={() => setFilter(s.label === 'In Stock' ? 'all' : s.label === 'Low Stock' ? 'low' : 'out')}
                        className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all hover:shadow-md ${
                            (filter === 'all' && s.label === 'In Stock') ||
                            (filter === 'low' && s.label === 'Low Stock') ||
                            (filter === 'out' && s.label === 'Out of Stock')
                                ? s.color === 'emerald' ? 'border-emerald-300 ring-2 ring-emerald-100'
                                : s.color === 'orange' ? 'border-orange-300 ring-2 ring-orange-100'
                                : 'border-red-300 ring-2 ring-red-100'
                                : 'border-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`w-4 h-4 ${s.color === 'emerald' ? 'text-emerald-500' : s.color === 'orange' ? 'text-orange-500' : 'text-red-500'}`} />
                            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                        </div>
                        <p className={`text-3xl font-black ${s.color === 'emerald' ? 'text-emerald-600' : s.color === 'orange' ? 'text-orange-500' : 'text-red-600'}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">{s.desc}</p>
                    </button>
                ))}
            </div>

            {/* Alert Banner for Out of Stock */}
            {outOfStock.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-800 mb-1">
                            {outOfStock.length} product{outOfStock.length > 1 ? 's' : ''} out of stock — customers can't buy these!
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {outOfStock.map(p => (
                                <span key={p.id} className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                                    <XCircle className="w-3 h-3" /> {p.title}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Low Stock Alert Banner */}
            {lowStock.length > 0 && outOfStock.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-4">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-orange-800 mb-1">
                            {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {lowStock.map(p => (
                                <span key={p.id} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                                    <AlertTriangle className="w-3 h-3" /> {p.title} ({p.stock_quantity} left)
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Filter */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl shadow-sm p-1">
                    {([['all', 'All'], ['low', 'Low Stock'], ['out', 'Out of Stock']] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                filter === val
                                    ? val === 'out' ? 'bg-red-600 text-white'
                                    : val === 'low' ? 'bg-orange-500 text-white'
                                    : 'bg-blue-600 text-white'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Stock Table */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <PackageOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" strokeWidth={1} />
                    <p className="text-gray-400 font-medium">No products found</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Alert Threshold</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Stock Qty</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Adjust</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(product => {
                                    const threshold = product.low_stock_threshold || 5;
                                    const isOut = product.stock_quantity === 0;
                                    const isLow = !isOut && product.stock_quantity <= threshold;
                                    const isSaving = saving[product.id];
                                    const isFlash = savedFlash[product.id];

                                    return (
                                        <tr
                                            key={product.id}
                                            className={`transition-colors ${
                                                isOut ? 'bg-red-50/40 hover:bg-red-50' :
                                                isLow ? 'bg-orange-50/30 hover:bg-orange-50/50' :
                                                'hover:bg-blue-50/20'
                                            }`}
                                        >
                                            {/* Product */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                                                        {product.image_urls?.[0] ? (
                                                            <img
                                                                src={product.image_urls[0]}
                                                                alt={product.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <PackageOpen className="w-4 h-4 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-sm">{product.title}</p>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                {isOut ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                                                        <XCircle className="w-3 h-3" /> Out of Stock
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700">
                                                        <AlertTriangle className="w-3 h-3" /> Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <CheckCircle2 className="w-3 h-3" /> In Stock
                                                    </span>
                                                )}
                                            </td>

                                            {/* Threshold */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="text-sm font-mono text-gray-500">{threshold} units</span>
                                            </td>

                                            {/* Stock Qty (editable) */}
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={inputValues[product.id] ?? product.stock_quantity}
                                                        onChange={e => handleInputChange(product.id, e.target.value)}
                                                        onBlur={() => handleInputBlur(product.id)}
                                                        className={`w-16 text-center px-2 py-1.5 rounded-lg border text-sm font-mono font-bold focus:outline-none transition ${
                                                            isOut
                                                                ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                                                                : isLow
                                                                ? 'border-orange-300 bg-orange-50 text-orange-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-200'
                                                                : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
                                                        }`}
                                                    />
                                                    {isSaving && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                                                    {isFlash && !isSaving && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                </div>
                                            </td>

                                            {/* Adjust buttons */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAdjust(product.id, -1)}
                                                        disabled={product.stock_quantity <= 0 || isSaving}
                                                        className="w-8 h-8 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 rounded-lg flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Decrease by 1"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdjust(product.id, 1)}
                                                        disabled={isSaving}
                                                        className="w-8 h-8 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-500 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                                                        title="Increase by 1"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdjust(product.id, 10)}
                                                        disabled={isSaving}
                                                        className="px-2.5 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg flex items-center justify-center transition disabled:opacity-40"
                                                        title="Add 10 units"
                                                    >
                                                        +10
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdjust(product.id, 50)}
                                                        disabled={isSaving}
                                                        className="px-2.5 h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg flex items-center justify-center transition disabled:opacity-40"
                                                        title="Add 50 units"
                                                    >
                                                        +50
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-xs text-gray-400">{filtered.length} of {products.length} products</p>
                        <p className="text-xs text-gray-300">Changes auto-save on input</p>
                    </div>
                </div>
            )}
        </div>
    );
}
