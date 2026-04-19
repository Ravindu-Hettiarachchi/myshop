'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PackageSearch, Plus, Search, AlertTriangle, Edit, Trash2, CheckCircle2, X, Loader2, UploadCloud, Image, ListPlus, Copy, Wand2 } from 'lucide-react';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';
import {
    DEFAULT_PRODUCT_UNIT,
    DEFAULT_STOCK_UNIT,
    DEFAULT_UNIT_VALUE,
    formatPriceWithUnit,
    formatStockWithUnit,
    getUnitLabel,
    normalizeSellingUnit,
    normalizeStockUnit,
    normalizeUnitValue,
    PRODUCT_UNITS,
    productUpsertSchema,
    type ProductUnit,
} from '@/lib/products';

interface VariantState {
    id?: string;
    sku: string;
    options: Record<string, string>;
    price_override: string;
    compare_at_price: string;
    stock_quantity: string;
    image_url: string;
}

interface ProductRecord {
    id: string;
    title: string;
    description: string | null;
    price: number;
    compare_at_price?: number | null;
    selling_unit_value: number;
    selling_unit: ProductUnit;
    stock_quantity: number;
    stock_unit: ProductUnit;
    low_stock_threshold: number | null;
    image_urls: string[];
    has_variants?: boolean;
    variation_options?: { name: string; raw_values: string }[];
    product_variants?: VariantState[];
}

interface ProductFormState {
    title: string;
    description: string;
    price: string;
    compare_at_price: string;
    selling_unit_value: string;
    selling_unit: ProductUnit;
    stock_quantity: string;
    stock_unit: ProductUnit;
    low_stock_threshold: string;
    image_urls: string[];
    has_variants: boolean;
    variation_options: { name: string; raw_values: string }[];
    variants: VariantState[];
}

export default function ProductsDashboard() {
    const supabase = createClient();
    const router = useRouter();
    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'sale'>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
    const [primaryGrouping, setPrimaryGrouping] = useState<string>('');
    const [formData, setFormData] = useState<ProductFormState>({
        title: '', description: '', price: '', compare_at_price: '', selling_unit_value: DEFAULT_UNIT_VALUE.toString(), selling_unit: DEFAULT_PRODUCT_UNIT, stock_quantity: '0', stock_unit: DEFAULT_STOCK_UNIT, low_stock_threshold: '5', image_urls: [],
        has_variants: false, variation_options: [], variants: []
    });
    
    // UI Sale Maker State
    const [saleConfig, setSaleConfig] = useState({ enabled: false, type: 'percent' as 'percent'|'fixed', value: '' });

    // Sync Sale Value into formData price and Variant prices
    useEffect(() => {
        if (saleConfig.enabled && formData.compare_at_price && saleConfig.value) {
            const orig = Number(formData.compare_at_price);
            const val = Number(saleConfig.value);
            if (!isNaN(orig) && !isNaN(val)) {
                let newPrice = orig;
                let discountPercent = 0;
                
                if (saleConfig.type === 'percent') {
                     newPrice = orig - (orig * (val / 100));
                     discountPercent = val;
                } else if (saleConfig.type === 'fixed') {
                     newPrice = orig - val;
                     discountPercent = (val / orig) * 100;
                }
                const formattedPrice = newPrice > 0 ? newPrice.toFixed(2) : '0.00';
                
                setFormData(prev => {
                    let updated = false;
                    const next = { ...prev };
                    
                    if (prev.price !== formattedPrice) {
                        next.price = formattedPrice;
                        updated = true;
                    }
                    
                    if (prev.has_variants && prev.variants.length > 0) {
                        const newVariants = prev.variants.map(v => {
                            // Only apply if the variant has a compare_at_price OR use the base compare_at_price as fallback
                            const varOrig = v.compare_at_price ? Number(v.compare_at_price) : orig;
                            if (!isNaN(varOrig) && varOrig > 0) {
                                const varNewPrice = varOrig - (varOrig * (discountPercent / 100));
                                const formattedVarPrice = varNewPrice > 0 ? varNewPrice.toFixed(2) : '0.00';
                                if (v.price_override !== formattedVarPrice || v.compare_at_price !== String(varOrig)) {
                                    updated = true;
                                    return { ...v, compare_at_price: String(varOrig), price_override: formattedVarPrice };
                                }
                            }
                            return v;
                        });
                        if (updated) {
                            next.variants = newVariants;
                        }
                    }
                    
                    return updated ? next : prev;
                });
            }
        }
    }, [saleConfig.enabled, saleConfig.type, saleConfig.value, formData.compare_at_price]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const variantFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login?next=/dashboard/products');
                setLoading(false);
                return;
            }

            const { data: owner } = await supabase
                .from('owners')
                .select('role')
                .eq('id', user.id)
                .maybeSingle<{ role: string | null }>();

            if (owner?.role !== 'shop_owner' && owner?.role !== 'admin') {
                router.replace('/');
                setLoading(false);
                return;
            }

            const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
            if (shop) {
                setShopId(shop.id);
                const { data } = await supabase.from('products').select('*, product_variants(*)').eq('shop_id', shop.id).order('created_at', { ascending: false });
                const normalizedProducts = (data || []).map((product) => ({
                    ...product,
                    selling_unit_value: normalizeUnitValue(product.selling_unit_value ?? product.unit_value),
                    selling_unit: normalizeSellingUnit(product.selling_unit ?? product.unit),
                    stock_quantity: Number(product.stock_quantity ?? 0),
                    stock_unit: normalizeStockUnit(product.stock_unit ?? product.selling_unit ?? product.unit),
                }));
                setProducts(normalizedProducts);
            }
            setLoading(false);
        }
        fetch();
    }, [supabase, router]);

    const filteredProducts = products.filter(p => {
        if (!p.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterMode === 'low_stock') return p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5);
        if (filterMode === 'sale') {
           const hasSale = p.compare_at_price != null && p.compare_at_price > p.price;
           const hasVariantSale = p.has_variants && p.product_variants?.some(v => v.compare_at_price != null && (v.price_override ? Number(v.compare_at_price) > Number(v.price_override) : Number(v.compare_at_price) > p.price));
           return hasSale || hasVariantSale;
        }
        return true;
    });

    const openModal = (product: ProductRecord | null = null) => {
        setEditingProduct(product);
        setUploadError(null);
        setFormError(null);
        
        let saleEnabled = false;
        let saleType: 'percent' | 'fixed' = 'percent';
        let saleVal = '';
        if (product && product.compare_at_price && Number(product.compare_at_price) > product.price) {
            saleEnabled = true;
            const orig = Number(product.compare_at_price);
            const curr = product.price;
            const diff = orig - curr;
            const pct = (diff / orig) * 100;
            if (Number.isInteger(pct)) {
                saleVal = pct.toString();
            } else {
                saleType = 'fixed';
                saleVal = diff.toFixed(2);
            }
        }
        setSaleConfig({ enabled: saleEnabled, type: saleType, value: saleVal });

        setFormData(product ? {
            title: product.title, description: product.description || '', price: product.price.toString(), compare_at_price: product.compare_at_price ? product.compare_at_price.toString() : '',
            selling_unit_value: normalizeUnitValue(product.selling_unit_value).toString(),
            selling_unit: normalizeSellingUnit(product.selling_unit),
            stock_quantity: Number(product.stock_quantity || 0).toString(),
            stock_unit: normalizeStockUnit(product.stock_unit),
            low_stock_threshold: Number(product.low_stock_threshold || 5).toString(), image_urls: product.image_urls || [],
            has_variants: product.has_variants || false,
            // Convert legacy generic array back to raw_values
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variation_options: (product.variation_options || []).map((o: any) => ({ name: o.name, raw_values: Array.isArray(o.values) ? o.values.join(', ') : o.values || o.raw_values || '' })),
            variants: (product.product_variants || []).map(v => ({ ...v, price_override: v.price_override ? String(v.price_override) : '', compare_at_price: v.compare_at_price ? String(v.compare_at_price) : '', stock_quantity: String(v.stock_quantity || 0), image_url: v.image_url || '' }))
        } : {
            title: '', description: '', price: '', compare_at_price: '', selling_unit_value: DEFAULT_UNIT_VALUE.toString(), selling_unit: DEFAULT_PRODUCT_UNIT,
            stock_quantity: '0', stock_unit: DEFAULT_STOCK_UNIT, low_stock_threshold: '5', image_urls: [],
            has_variants: false, variation_options: [], variants: []
        });
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shopId) return;

        setUploadError(null);
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `${shopId}/products/${fileName}`;

            const { publicUrl } = await uploadToShopAssets({
                supabase,
                file,
                filePath,
                upsert: true,
            });

            setFormData(prev => ({ ...prev, image_urls: [publicUrl, ...prev.image_urls.filter(u => u !== publicUrl)] }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
            setUploadError(message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (url: string) => {
        setFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter(u => u !== url) }));
    };

    const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shopId || uploadingVariantIndex === null) return;

        setUploadError(null);
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `variant-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `${shopId}/products/variants/${fileName}`;

            const { publicUrl } = await uploadToShopAssets({ supabase, file, filePath, upsert: true });

            const nextVariants = [...formData.variants];
            nextVariants[uploadingVariantIndex].image_url = publicUrl;
            setFormData(prev => ({ ...prev, variants: nextVariants }));
        } catch (err: unknown) {
             setUploadError(err instanceof Error ? err.message : 'Variant upload failed.');
        } finally {
            setIsUploading(false);
            setUploadingVariantIndex(null);
            if (variantFileInputRef.current) variantFileInputRef.current.value = '';
        }
    };

    const addVariationOption = () => {
        setFormData(prev => ({ ...prev, variation_options: [...prev.variation_options, { name: '', raw_values: '' }] }));
    };

    const updateVariationOption = (idx: number, field: 'name' | 'raw_values', val: string) => {
        const newOpts = [...formData.variation_options];
        newOpts[idx] = { ...newOpts[idx], [field]: val };
        setFormData(prev => ({ ...prev, variation_options: newOpts }));
    };

    const removeVariationOption = (idx: number) => {
        setFormData(prev => ({ ...prev, variation_options: prev.variation_options.filter((_, i) => i !== idx) }));
    };

    const generateCombinations = () => {
        const parsedOptions = formData.variation_options.map(o => ({
            name: o.name.trim(),
            values: o.raw_values.split(',').map(s => s.trim()).filter(Boolean)
        }));
        
        const options = parsedOptions.filter(o => o.name && o.values.length > 0);
        if (options.length === 0) return;

        let combos: Record<string, string>[] = [{}];
        for (const opt of options) {
            const nextCombos: Record<string, string>[] = [];
            for (const combo of combos) {
                for (const val of opt.values) {
                    nextCombos.push({ ...combo, [opt.name]: val });
                }
            }
            combos = nextCombos;
        }

        const newVariants: VariantState[] = combos.map(combo => {
            const existing = formData.variants.find(v => JSON.stringify(v.options) === JSON.stringify(combo));
            return existing || { sku: '', options: combo, price_override: '', compare_at_price: '', stock_quantity: '0', image_url: '' };
        });

        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const getSupabaseErrorMessage = (err: unknown): string => {
        if (err instanceof Error) return err.message;
        if (err && typeof err === 'object') {
            const maybe = err as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
            const parts = [maybe.message, maybe.details, maybe.hint, maybe.code]
                .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
            if (parts.length > 0) return parts.join(' | ');
        }
        return 'Failed to save product.';
    };

    const isProductsSchemaMismatch = (message: string): boolean => {
        const lower = message.toLowerCase();
        return (
            (lower.includes('column') && (lower.includes('selling_unit') || lower.includes('stock_unit') || lower.includes('selling_unit_value'))) ||
            lower.includes('schema cache') ||
            lower.includes('pgrst204')
        );
    };

    const handleSave = async () => {
        if (!shopId) return;
        setFormError(null);
        setIsSaving(true);
        try {
            const mappedVariationOptions = formData.variation_options.map(o => ({
                name: o.name.trim(),
                values: o.raw_values.split(',').map(s => s.trim()).filter(Boolean)
            })).filter(o => o.name && o.values.length > 0);

            const parsed = productUpsertSchema.safeParse({
                ...formData,
                image_urls: formData.image_urls.filter(u => u.trim() !== ''),
                variation_options: mappedVariationOptions,
            });

            if (!parsed.success) {
                setFormError(parsed.error.issues[0]?.message || 'Invalid product details.');
                return;
            }

            const res = await fetch('/api/products/upsert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingProduct?.id,
                    ...parsed.data
                })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to save product');

            const savedProduct = {
                ...json.product,
                product_variants: json.product.has_variants ? parsed.data.variants : [],
                selling_unit_value: normalizeUnitValue(json.product.selling_unit_value),
                selling_unit: normalizeSellingUnit(json.product.selling_unit),
                stock_quantity: Number(json.product.stock_quantity ?? 0),
                stock_unit: normalizeStockUnit(json.product.stock_unit),
            };

            if (editingProduct) {
                setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
            } else {
                setProducts([savedProduct, ...products]);
            }
            closeModal();
            
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save product.';
            setFormError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').delete().eq('id', id);
        setProducts(products.filter(p => p.id !== id));
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading products...</p>
                </div>
            </div>
        );
    }

    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage your inventory, pricing, and stock levels</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-sm shadow-blue-200"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Products', value: products.length, color: 'blue' },
                    { label: 'Low Stock', value: lowStock, color: 'orange' },
                    { label: 'Out of Stock', value: outOfStock, color: 'red' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color === 'blue' ? 'text-blue-600' : s.color === 'orange' ? 'text-orange-500' : 'text-red-600'}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3 flex-1 w-full">
                    <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-full sm:w-auto">
                    {(['all', 'low_stock', 'sale'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filterMode === mode ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            {mode === 'all' ? 'All Products' : mode === 'low_stock' ? 'Low Stock' : 'Sale Items'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Table / Empty */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PackageSearch className="w-7 h-7 text-blue-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{search ? 'No results found' : 'No products yet'}</h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        {search ? `No product matches "${search}".` : 'Add your first product to start selling.'}
                    </p>
                    {!search && (
                        <button onClick={() => openModal()} className="mt-5 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition">
                            + Add First Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Stock Status</th>
                                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map((product) => {
                                    const isOut = product.stock_quantity === 0;
                                    const isLow = !isOut && product.stock_quantity <= (product.low_stock_threshold || 5);
                                    const isOk = !isOut && !isLow;

                                    return (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            {/* Product */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                                                        {product.image_urls?.[0] ? (
                                                            <img
                                                                src={product.image_urls[0]}
                                                                alt={product.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Image className="w-5 h-5 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm leading-none mb-0.5">{product.title}</p>
                                                        <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{product.description || '—'}</p>
                                                        <p className="text-[11px] text-gray-500 mt-1">Stock: {formatStockWithUnit(product.stock_quantity, product.stock_unit)} available</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900">
                                                            {formatPriceWithUnit(product.price, product.selling_unit, product.selling_unit_value)}
                                                </span>
                                            </td>

                                            {/* Stock Status */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {isOut ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700">
                                                            <AlertTriangle className="w-3 h-3" /> Out of Stock
                                                        </span>
                                                    ) : isLow ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700">
                                                            <AlertTriangle className="w-3 h-3" /> Low — {formatStockWithUnit(product.stock_quantity, product.stock_unit)} left
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                            <CheckCircle2 className="w-3 h-3" /> In Stock — {formatStockWithUnit(product.stock_quantity, product.stock_unit)}
                                                        </span>
                                                    )}
                                                    <p className="text-[10px] text-gray-300 pl-0.5">Alert threshold: {Number(product.low_stock_threshold || 5).toLocaleString()}{getUnitLabel(product.stock_unit)}</p>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
                        <p className="text-xs text-gray-400">{filteredProducts.length} of {products.length} products</p>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-2xl w-full ${formData.has_variants ? 'max-w-5xl' : 'max-w-2xl'} shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">{editingProduct ? 'Update product details' : 'Fill in the details below to add a product'}</p>
                            </div>
                            <button onClick={closeModal} className="p-2 text-gray-300 hover:text-gray-500 rounded-lg hover:bg-gray-50 transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-gray-50/50">

                            {uploadError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
                                    {uploadError}
                                </div>
                            )}

                            {formError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
                                    {formError}
                                </div>
                            )}

                            {/* 1. General Details */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="text-sm font-bold text-gray-900">1. Product Identity</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Basic details that customers will see</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images</label>
                                    {/* Upload Area */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                <span className="text-xs text-blue-500 font-medium">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition" />
                                                <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition">Click to upload</span>
                                                <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                                            </>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                    <input ref={variantFileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleVariantImageUpload} disabled={isUploading} />

                                    {/* Image Previews */}
                                    {formData.image_urls.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {formData.image_urls.map((url, idx) => (
                                                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group/img shadow-sm">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                        <X className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* URL input */}
                                    <div className="mt-3">
                                        <input
                                            type="url"
                                            placeholder="Or paste an image URL here..."
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (val) { setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, val] })); (e.target as HTMLInputElement).value = ''; }
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                if (val) { setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, val] })); e.target.value = ''; }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="e.g. Premium Ceylon Cinnamon" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                    <textarea value={formData.description} rows={2} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none" placeholder="Give your product a nice description..." />
                                </div>
                            </div>

                            {/* 2. Pricing & Format */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="border-b border-gray-100 pb-3">
                                    <h3 className="text-sm font-bold text-gray-900">2. Pricing Strategy</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">How will customers purchase this item?</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-5">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1.5">
                                            Pricing Strategy
                                            {saleConfig.enabled && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider shadow-sm">On Sale</span>}
                                        </label>
                                        <div className="relative mb-3">
                                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">Rs.</span>
                                            <input type="number" step="0.01" required value={saleConfig.enabled ? formData.compare_at_price : formData.price} 
                                                onChange={e => {
                                                    if (saleConfig.enabled) {
                                                        setFormData({ ...formData, compare_at_price: e.target.value });
                                                    } else {
                                                        setFormData({ ...formData, price: e.target.value });
                                                    }
                                                }}
                                                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium" placeholder="0.00" />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer bg-red-50 hover:bg-red-100/60 p-2 rounded-lg border border-red-100 transition">
                                            <input type="checkbox" checked={saleConfig.enabled} onChange={e => {
                                                const checked = e.target.checked;
                                                setSaleConfig(s => ({ ...s, enabled: checked }));
                                                if (checked && !formData.compare_at_price && formData.price) {
                                                    setFormData(f => ({ ...f, compare_at_price: f.price, price: '' }));
                                                } else if (!checked && formData.compare_at_price) {
                                                    setFormData(f => ({ ...f, price: f.compare_at_price, compare_at_price: '' }));
                                                }
                                            }} className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
                                            <span className="text-xs font-bold text-red-700">Put this item on Sale</span>
                                        </label>
                                    </div>

                                    {saleConfig.enabled && (
                                        <div className="sm:col-span-2 bg-gradient-to-br from-red-50/50 to-orange-50/30 p-4 rounded-xl border border-red-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount Amount</label>
                                                <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-400">
                                                    <select value={saleConfig.type} onChange={e => setSaleConfig({...saleConfig, type: e.target.value as 'percent'|'fixed'})}
                                                        className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 outline-none cursor-pointer flex-shrink-0">
                                                        <option value="percent">% Off</option>
                                                        <option value="fixed">Fixed</option>
                                                    </select>
                                                    <input type="number" step={saleConfig.type === 'percent' ? "1" : "0.01"} min="0" required value={saleConfig.value} onChange={e => setSaleConfig({...saleConfig, value: e.target.value})}
                                                        className="w-full px-3 py-2.5 text-sm outline-none font-medium flex-1 min-w-0" placeholder={saleConfig.type === 'percent' ? "25" : "500.00"} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Final Selling Price</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-red-400 text-sm font-bold">Rs.</span>
                                                    <input type="text" readOnly value={formData.price}
                                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-red-200 bg-red-50/50 text-red-600 text-sm outline-none font-black" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity Sold per Unit *</label>
                                        <input type="number" step="0.001" min="0.001" required value={formData.selling_unit_value} onChange={e => setFormData({ ...formData, selling_unit_value: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium" placeholder="1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Metric *</label>
                                        <select value={formData.selling_unit} onChange={e => setFormData({ ...formData, selling_unit: normalizeSellingUnit(e.target.value) })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-gray-700">
                                            {PRODUCT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Inventory & Variations */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="border-b border-gray-100 pb-3 flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">3. Warehouse & Variations</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Track stock and manage unique options like Size or Color.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                                        <span className="text-sm font-bold text-blue-800">Has Variations?</span>
                                        <input type="checkbox" checked={formData.has_variants} onChange={e => setFormData({...formData, has_variants: e.target.checked})} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                                    </label>
                                </div>

                                {!formData.has_variants ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Available Stock *</label>
                                            <input type="number" step="0.001" min="0" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Measured In (Unit) *</label>
                                            <select value={formData.stock_unit} onChange={e => setFormData({ ...formData, stock_unit: normalizeStockUnit(e.target.value) })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-gray-700">
                                                {PRODUCT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                                                Low Stock Limit <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                            </label>
                                            <input type="number" step="0.001" min="0" value={formData.low_stock_threshold} onChange={e => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-orange-50/30 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="5" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-semibold text-gray-900">Custom Options (Max 3)</h4>
                                                {formData.variation_options.length < 3 && (
                                                    <button type="button" onClick={addVariationOption} className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition shadow-sm">
                                                        <Plus className="w-3 h-3" /> Add Option
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {formData.variation_options.length === 0 && <p className="text-xs text-gray-500">e.g., Color, Size, Material. Click &apos;Add Option&apos; to start.</p>}
                                            
                                            <div className="space-y-3">
                                                {formData.variation_options.map((opt, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                                        <input type="text" placeholder="e.g. Size" value={opt.name} onChange={e => updateVariationOption(idx, 'name', e.target.value)} className="w-full sm:w-1/3 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white" />
                                                        <input type="text" placeholder="Small, Medium, Large (comma separated)" value={opt.raw_values} onChange={e => updateVariationOption(idx, 'raw_values', e.target.value)} className="w-full flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white" />
                                                        <button type="button" onClick={() => removeVariationOption(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {formData.variation_options.length > 0 && (
                                                <button type="button" onClick={generateCombinations} className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition shadow-sm">
                                                    <Wand2 className="w-4 h-4" /> Generate Variation Grid
                                                </button>
                                            )}
                                        </div>
                                    
                                        {formData.variants.length > 0 && (() => {
                                            const availableKeys = Array.from(new Set(formData.variants.flatMap(v => Object.keys(v.options))));
                                            
                                            // Fallback logic for active key
                                            const primaryOptionKey = availableKeys.includes(primaryGrouping) 
                                                ? primaryGrouping 
                                                : (availableKeys[0] || 'Variant');
                                                
                                            const otherOptionKeys = availableKeys.filter(k => k !== primaryOptionKey);
                                            
                                            // Group variants by the primary option
                                            const groupedVariants = formData.variants.reduce((acc, v, i) => {
                                                const groupVal = v.options[primaryOptionKey] || 'Other';
                                                if (!acc[groupVal]) acc[groupVal] = [];
                                                acc[groupVal].push({ index: i, variant: v });
                                                return acc;
                                            }, {} as Record<string, {index: number, variant: VariantState}[]>);

                                            return (
                                                <div className="space-y-4">
                                                    {availableKeys.length > 1 && (
                                                        <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100 shadow-sm">
                                                            <label className="text-sm font-semibold text-blue-900">Main Grouping:</label>
                                                            <select 
                                                                value={primaryOptionKey} 
                                                                onChange={(e) => setPrimaryGrouping(e.target.value)}
                                                                className="bg-white border border-blue-200 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none hover:border-blue-300 transition"
                                                            >
                                                                {availableKeys.map(k => (
                                                                    <option key={k} value={k}>{k}</option>
                                                                ))}
                                                            </select>
                                                            <span className="text-xs text-blue-600/80">Select which option acts as the master group for applying bulk images/stock.</span>
                                                        </div>
                                                    )}
                                                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                                            <tr>
                                                                {formData.image_urls.length > 0 && <th className="px-4 py-3 font-semibold">Image</th>}
                                                                <th className="px-4 py-3 font-semibold">{otherOptionKeys.length > 0 ? otherOptionKeys.join(' / ') : 'Variant'}</th>
                                                                <th className="px-4 py-3 font-semibold border-l border-gray-100 text-blue-700">Stock Qty *</th>
                                                                <th className="px-4 py-3 font-semibold border-l border-gray-100">Price Override</th>
                                                                <th className="px-4 py-3 font-semibold border-l border-gray-100">Compare At</th>
                                                                <th className="px-4 py-3 font-semibold border-l border-gray-100">SKU</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {Object.entries(groupedVariants).map(([groupName, items]) => (
                                                                <React.Fragment key={groupName}>
                                                                    {/* Group Header Row for Bulk Actions */}
                                                                    <tr className="bg-blue-50/50 border-t-2 border-blue-100">
                                                                        <td colSpan={formData.image_urls.length > 0 ? 6 : 5} className="px-4 py-3">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-1 rounded">{primaryOptionKey}</span>
                                                                                    <span className="font-black text-gray-900 text-base">{groupName}</span>
                                                                                    <span className="text-xs text-gray-500 font-medium">({items.length} variants)</span>
                                                                                </div>
                                                                                
                                                                                <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-blue-100 shadow-sm">
                                                                                    <span className="text-xs font-bold text-gray-500 px-2">BULK APPLY:</span>
                                                                                    
                                                                                    {formData.image_urls.length > 0 && (
                                                                                        <div className="flex gap-1 border-r border-gray-200 pr-3">
                                                                                            {formData.image_urls.map((url, imgIdx) => (
                                                                                                <button type="button" key={imgIdx} 
                                                                                                    onClick={() => {
                                                                                                        const next = [...formData.variants];
                                                                                                        items.forEach(item => next[item.index].image_url = url);
                                                                                                        setFormData({...formData, variants: next});
                                                                                                    }}
                                                                                                    className="w-7 h-7 rounded overflow-hidden border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition">
                                                                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                                                                </button>
                                                                                            ))}
                                                                                            <button type="button" onClick={() => {
                                                                                                const next = [...formData.variants];
                                                                                                items.forEach(item => next[item.index].image_url = '');
                                                                                                setFormData({...formData, variants: next});
                                                                                            }} className="w-7 h-7 rounded flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-500 transition" title="Clear Images">
                                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    <div className="flex bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                                                                        <input type="number" placeholder="Stock..." className="w-16 px-2 py-1.5 text-xs outline-none bg-transparent" 
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    const val = (e.target as HTMLInputElement).value;
                                                                                                    if (val) {
                                                                                                        const next = [...formData.variants];
                                                                                                        items.forEach(item => next[item.index].stock_quantity = val);
                                                                                                        setFormData({...formData, variants: next});
                                                                                                        (e.target as HTMLInputElement).value = '';
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <button type="button" 
                                                                                            onClick={(e) => {
                                                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                                                const val = input.value;
                                                                                                if (val) {
                                                                                                    const next = [...formData.variants];
                                                                                                    items.forEach(item => next[item.index].stock_quantity = val);
                                                                                                    setFormData({...formData, variants: next});
                                                                                                    input.value = '';
                                                                                                }
                                                                                            }}
                                                                                            className="px-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center justify-center" title="Press Enter or click to apply stock">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="flex bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                                                                        <input type="number" placeholder="Price..." className="w-16 px-2 py-1.5 text-xs outline-none bg-transparent" 
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    const val = (e.target as HTMLInputElement).value;
                                                                                                    if (val) {
                                                                                                        const next = [...formData.variants];
                                                                                                        items.forEach(item => next[item.index].price_override = val);
                                                                                                        setFormData({...formData, variants: next});
                                                                                                        (e.target as HTMLInputElement).value = '';
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <button type="button" 
                                                                                            onClick={(e) => {
                                                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                                                const val = input.value;
                                                                                                if (val) {
                                                                                                    const next = [...formData.variants];
                                                                                                    items.forEach(item => next[item.index].price_override = val);
                                                                                                    setFormData({...formData, variants: next});
                                                                                                    input.value = '';
                                                                                                }
                                                                                            }}
                                                                                            className="px-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center justify-center" title="Press Enter or click to apply price">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                    <div className="flex bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                                                                        <input type="number" placeholder="Orig Price..." className="w-20 px-2 py-1.5 text-xs outline-none bg-transparent" 
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') {
                                                                                                    e.preventDefault();
                                                                                                    const val = (e.target as HTMLInputElement).value;
                                                                                                    if (val) {
                                                                                                        const next = [...formData.variants];
                                                                                                        items.forEach(item => next[item.index].compare_at_price = val);
                                                                                                        setFormData({...formData, variants: next});
                                                                                                        (e.target as HTMLInputElement).value = '';
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                        <button type="button" 
                                                                                            onClick={(e) => {
                                                                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                                                const val = input.value;
                                                                                                if (val) {
                                                                                                    const next = [...formData.variants];
                                                                                                    items.forEach(item => next[item.index].compare_at_price = val);
                                                                                                    setFormData({...formData, variants: next});
                                                                                                    input.value = '';
                                                                                                }
                                                                                            }}
                                                                                            className="px-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center justify-center" title="Press Enter or click to apply original price">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    
                                                                    {/* Individual Variant Rows */}
                                                                    {items.map(({ index: i, variant: v }) => (
                                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                                            {formData.image_urls.length > 0 && (
                                                                                <td className="px-4 py-2 border-r border-gray-100 pl-8">
                                                                                    {v.image_url ? (
                                                                                        <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden">
                                                                                            <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-10 h-10 rounded border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-[9px] text-gray-400 font-medium">
                                                                                            <Image className="w-4 h-4 mb-0.5 opacity-50" />
                                                                                            None
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                            )}
                                                                            <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={otherOptionKeys.map(k => v.options[k]).join(' / ')}>
                                                                                {otherOptionKeys.length > 0 ? otherOptionKeys.map(k => v.options[k]).join(' / ') : <span className="text-gray-400 italic">Default</span>}
                                                                            </td>
                                                                            <td className="px-4 py-2.5 border-l border-gray-100 bg-blue-50/10">
                                                                                <input type="number" min="0" placeholder="0" required value={v.stock_quantity} onChange={e => {
                                                                                    const next = [...formData.variants];
                                                                                    next[i].stock_quantity = e.target.value;
                                                                                    setFormData({...formData, variants: next});
                                                                                }} className="w-20 px-2.5 py-1.5 border border-blue-200 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30" />
                                                                            </td>
                                                                            <td className="px-4 py-2.5 border-l border-gray-100">
                                                                                <div className="relative">
                                                                                    <span className="absolute left-2.5 top-2 text-gray-400 text-xs">Rs.</span>
                                                                                    <input type="number" placeholder="Optional" value={v.price_override} onChange={e => {
                                                                                        const next = [...formData.variants];
                                                                                        next[i].price_override = e.target.value;
                                                                                        setFormData({...formData, variants: next});
                                                                                    }} className="w-24 pl-7 pr-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2.5 border-l border-gray-100">
                                                                                <div className="relative">
                                                                                    <span className="absolute left-2.5 top-2 text-gray-400 text-xs">Rs.</span>
                                                                                    <input type="number" placeholder="Optional" value={v.compare_at_price} onChange={e => {
                                                                                        const next = [...formData.variants];
                                                                                        next[i].compare_at_price = e.target.value;
                                                                                        setFormData({...formData, variants: next});
                                                                                    }} className="w-24 pl-7 pr-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-2.5 border-l border-gray-100">
                                                                                <input type="text" placeholder="e.g. SK-12" value={v.sku} onChange={e => {
                                                                                    const next = [...formData.variants];
                                                                                    next[i].sku = e.target.value;
                                                                                    setFormData({...formData, variants: next});
                                                                                }} className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    </div>
                                )}
                            </div>
                            
                            {/* Live Conversational Preview */}
                            {(formData.price && formData.selling_unit_value && formData.selling_unit) ? (
                                <div className="mx-2 mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                                        <span className="text-blue-600 text-xs font-black">i</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        Customers will pay <strong className="text-gray-900 border-b border-gray-300 pb-0.5">Rs. {Number(formData.price).toLocaleString()}</strong> for every <strong className="text-gray-900 border-b border-gray-300 pb-0.5">{formData.selling_unit_value} {formData.selling_unit}</strong> they select. 
                                        {formData.stock_quantity ? (
                                            <> You currently have <strong className="text-blue-700">{formData.stock_quantity} {formData.stock_unit}</strong> stored in your system.</>
                                        ) : ''}
                                    </p>
                                </div>
                            ) : null}

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                            <button onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving || isUploading}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {editingProduct ? 'Save Changes' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
