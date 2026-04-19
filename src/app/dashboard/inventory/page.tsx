'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    BarChart3, AlertTriangle, CheckCircle2, XCircle, Plus, Minus,
    RefreshCw, PackageOpen, Search, X, Loader2, Bell, TrendingDown,
    Save, History, Archive, RotateCcw, Edit
} from 'lucide-react';

interface Product {
    id: string;
    title: string;
    sku: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
    price: number;
    image_urls: string[];
    is_active: boolean;
}

export default function InventoryPage() {
    const supabase = createClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'archived'>('all');
    
    const [pendingEdits, setPendingEdits] = useState<Record<string, { stock_quantity?: number, low_stock_threshold?: number }>>({});
    const [isSavingBulk, setIsSavingBulk] = useState(false);
    
    const [restockProduct, setRestockProduct] = useState<Product | null>(null);
    const [restockDelta, setRestockDelta] = useState<number>(10);
    const [restockNote, setRestockNote] = useState('');
    const [isRestocking, setIsRestocking] = useState(false);

    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [historyEvents, setHistoryEvents] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
        if (shop) {
            setShopId(shop.id);
            const { data } = await supabase
                .from('products')
                .select('id, title, sku, stock_quantity, low_stock_threshold, price, image_urls, is_active')
                .eq('shop_id', shop.id)
                .order('stock_quantity', { ascending: true });
            if (data) {
                setProducts(data);
                setPendingEdits({});
            }
        }
        setLoading(false);
    }, [supabase]);

     
    useEffect(() => {
        const load = async () => { await fetchProducts(); };
        load();
    }, [fetchProducts]);

    const handleEditField = (productId: string, field: 'stock_quantity' | 'low_stock_threshold', value: string) => {
        const num = Math.max(0, parseInt(value) || 0);
        setPendingEdits(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: num
            }
        }));
    };

    const getDisplayValue = (product: Product, field: 'stock_quantity' | 'low_stock_threshold') => {
        return pendingEdits[product.id]?.[field] ?? (product[field] || 0);
    };

    const handleBulkSave = async () => {
        const pIds = Object.keys(pendingEdits);
        if (pIds.length === 0) return;
        setIsSavingBulk(true);

        const adjustments = [];
        const thresholdUpdates = [];

        for (const pId of pIds) {
            const product = products.find(p => p.id === pId);
            if (!product) continue;
            
            const edit = pendingEdits[pId];
            if (edit.stock_quantity !== undefined && edit.stock_quantity !== product.stock_quantity) {
                const delta = edit.stock_quantity - product.stock_quantity;
                adjustments.push({ productId: pId, delta, reason: 'BULK_EDIT' });
            }
            if (edit.low_stock_threshold !== undefined && edit.low_stock_threshold !== (product.low_stock_threshold || 5)) {
                thresholdUpdates.push({ id: pId, low_stock_threshold: edit.low_stock_threshold });
            }
        }

        if (adjustments.length > 0) {
            await fetch('/api/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adjustments })
            });
        }

        if (thresholdUpdates.length > 0) {
            for (const t of thresholdUpdates) {
                await supabase.from('products').update({ low_stock_threshold: t.low_stock_threshold }).eq('id', t.id);
            }
        }

        await fetchProducts();
        setIsSavingBulk(false);
    };

    const handleQuickRestockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restockProduct || restockDelta <= 0) return;
        setIsRestocking(true);

        await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                adjustments: [{
                    productId: restockProduct.id,
                    delta: restockDelta,
                    reason: restockNote || 'QUICK_RESTOCK'
                }]
            })
        });

        await fetchProducts();
        setRestockProduct(null);
        setRestockDelta(10);
        setRestockNote('');
        setIsRestocking(false);
    };

    const fetchHistoryEvents = async (product: Product) => {
        setHistoryProduct(product);
        setLoadingHistory(true);
        const { data } = await supabase
            .from('stock_movements')
            .select('*')
            .eq('product_id', product.id)
            .order('created_at', { ascending: false })
            .limit(50);
        setHistoryEvents(data || []);
        setLoadingHistory(false);
    };

    const toggleArchive = async (productId: string, currentActive: boolean) => {
        if (!confirm(`Are you sure you want to ${currentActive ? 'archive' : 'unarchive'} this product?`)) return;
        await fetch('/api/inventory/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: [productId], isActive: !currentActive })
        });
        await fetchProducts();
    };

    const activeProducts = products.filter(p => p.is_active !== false);
    const outOfStock = activeProducts.filter(p => p.stock_quantity === 0);
    const lowStock = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5));
    const inStock = activeProducts.filter(p => p.stock_quantity > (p.low_stock_threshold || 5));
    const archivedProducts = products.filter(p => p.is_active === false);

    const filtered = products.filter(p => {
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
        
        if (filter === 'archived') return matchSearch && p.is_active === false;
        if (p.is_active === false) return false; // Prevent archived in other views

        if (filter === 'out') return matchSearch && p.stock_quantity === 0;
        if (filter === 'low') return matchSearch && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
        return matchSearch;
    });

    const hasPendingEdits = Object.keys(pendingEdits).length > 0;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600" /> Inventory & Stock
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage stock levels safely and track movement history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchProducts} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {hasPendingEdits && (
                        <button onClick={handleBulkSave} disabled={isSavingBulk} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50">
                            {isSavingBulk ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                            Update {Object.keys(pendingEdits).length} Products
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'In Stock', value: inStock.length, color: 'emerald', icon: CheckCircle2, filter: 'all' },
                    { label: 'Low Stock', value: lowStock.length, color: 'orange', icon: TrendingDown, filter: 'low' },
                    { label: 'Out of Stock', value: outOfStock.length, color: 'red', icon: XCircle, filter: 'out' },
                    { label: 'Archived', value: archivedProducts.length, color: 'gray', icon: Archive, filter: 'archived' },
                ].map(s => (
                    <button
                        key={s.label}
                        onClick={() => setFilter(s.filter as 'all' | 'low' | 'out' | 'archived')}
                        className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all hover:shadow-md ${filter === s.filter ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-100'}`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <s.icon className={`w-4 h-4 text-${s.color}-500`} />
                            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                        </div>
                        <p className={`text-2xl lg:text-3xl font-black text-${s.color}-600`}>{s.value}</p>
                    </button>
                ))}
            </div>

            {/* Smart Alerts */}
            {outOfStock.length > 0 && filter !== 'archived' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4">
                    <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-800 mb-1">{outOfStock.length} product(s) entirely out of stock!</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {outOfStock.slice(0, 3).map(p => (
                                <button key={p.id} onClick={() => setRestockProduct(p)} className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 transition text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                                    <Plus className="w-3 h-3" /> Restock {p.title}
                                </button>
                            ))}
                            {outOfStock.length > 3 && <span className="text-xs text-red-500 self-center">+{outOfStock.length - 3} more</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Filter */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Search products by SKU or title..."
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>}
            </div>

            {/* Product Stock Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Threshold</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">Stock Qty</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(product => {
                                const threshold = getDisplayValue(product, 'low_stock_threshold');
                                const qty = getDisplayValue(product, 'stock_quantity');
                                const isOut = qty === 0;
                                const isLow = !isOut && qty <= threshold;
                                const hasEdit = !!pendingEdits[product.id];

                                return (
                                    <tr key={product.id} className={`transition-colors ${!product.is_active ? 'opacity-60 bg-gray-50' : 'hover:bg-blue-50/20'}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                                                    {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt="" className="object-cover w-full h-full" /> : <PackageOpen className="w-4 h-4 text-gray-300 m-3" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{product.title}</p>
                                                    <p className="text-xs text-blue-500 font-mono mt-0.5">{product.sku || 'NO-SKU'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {!product.is_active ? (
                                                <span className="text-gray-500 bg-gray-100 text-xs px-2 py-1 rounded font-bold">Archived</span>
                                            ) : isOut ? (
                                                <span className="text-red-700 bg-red-100 text-xs px-2 py-1 rounded font-bold">Out of Stock</span>
                                            ) : isLow ? (
                                                <span className="text-orange-700 bg-orange-100 text-xs px-2 py-1 rounded font-bold">Low Stock</span>
                                            ) : (
                                                <span className="text-emerald-700 bg-emerald-100 text-xs px-2 py-1 rounded font-bold">Healthy</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                value={threshold}
                                                onChange={(e) => handleEditField(product.id, 'low_stock_threshold', e.target.value)}
                                                className={`w-16 text-center px-1 py-1 rounded border text-xs bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500`}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={qty}
                                                    onChange={(e) => handleEditField(product.id, 'stock_quantity', e.target.value)}
                                                    className={`w-20 text-center px-2 py-1.5 rounded-lg border text-sm font-black font-mono shadow-inner ${hasEdit ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-gray-200 bg-white'}`}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {product.is_active && isOut && (
                                                    <button onClick={() => setRestockProduct(product)} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded shadow flex items-center gap-1 transition">
                                                        Restock
                                                    </button>
                                                )}
                                                <button onClick={() => fetchHistoryEvents(product)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition" title="View History">
                                                    <History className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => toggleArchive(product.id, product.is_active)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title={product.is_active ? "Archive Product" : "Unarchive"}>
                                                    {product.is_active ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">No products match your filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Restock Modal */}
            {restockProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg">Quick Restock</h3>
                            <button onClick={() => setRestockProduct(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleQuickRestockSubmit} className="p-6 space-y-5">
                            <div className="flex gap-3 items-center border border-gray-100 p-3 rounded-xl bg-gray-50">
                                {restockProduct.image_urls?.[0] ? <img src={restockProduct.image_urls[0]} alt="" className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 bg-white rounded border flex items-center justify-center"><PackageOpen className="w-5 h-5 text-gray-300"/></div>}
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{restockProduct.title}</p>
                                    <p className="text-xs text-blue-600 font-mono">{restockProduct.sku}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Received Quantity (Delta) <span className="text-red-500">*</span></label>
                                <input type="number" min="1" required value={restockDelta} onChange={(e) => setRestockDelta(parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded-lg p-3 text-lg font-black text-center focus:ring-2 focus:ring-blue-500 outline-none"/>
                                <p className="text-xs text-gray-500 mt-1">This amount will be added to the current stock.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Restock Note / Supplier (Optional)</label>
                                <input type="text" value={restockNote} onChange={(e) => setRestockNote(e.target.value)} placeholder="e.g. Shipment from DHL" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"/>
                            </div>

                            <div className="pt-2">
                                <button type="submit" disabled={isRestocking} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isRestocking ? 'Restocking...' : 'Add Stock Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Stock History</h3>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{historyProduct.title} ({historyProduct.sku})</p>
                            </div>
                            <button onClick={() => setHistoryProduct(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-lg"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            {loadingHistory ? (
                                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500"/></div>
                            ) : historyEvents.length === 0 ? (
                                <div className="py-12 text-center text-gray-500 text-sm">No historical stock movements exist for this product.</div>
                            ) : (
                                <div className="space-y-3">
                                    {historyEvents.map((evt) => (
                                        <div key={evt.id} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${evt.quantity_delta > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {evt.quantity_delta > 0 ? <TrendingDown className="w-5 h-5 rotate-180" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm">{evt.quantity_delta > 0 ? '+' : ''}{evt.quantity_delta} units</p>
                                                <p className="text-xs text-gray-500 truncate">{evt.reason.replace(/_/g, ' ')} {evt.reference_id && `(#${evt.reference_id})`}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{evt.previous_stock} → {evt.new_stock}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(evt.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
