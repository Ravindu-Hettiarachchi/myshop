'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PackageSearch, Plus, Search, AlertTriangle, Edit, Trash2, CheckCircle2, X, Loader2, UploadCloud, ImageIcon, Image } from 'lucide-react';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';

interface ProductRecord {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock_quantity: number;
    low_stock_threshold: number | null;
    image_urls: string[];
}

export default function ProductsDashboard() {
    const supabase = createClient();
    const [products, setProducts] = useState<ProductRecord[]>([]);
    const [shopId, setShopId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '', description: '', price: '', stock_quantity: 0, low_stock_threshold: 5, image_urls: [] as string[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
            if (shop) {
                setShopId(shop.id);
                const { data } = await supabase.from('products').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false });
                setProducts(data || []);
            }
            setLoading(false);
        }
        fetch();
    }, [supabase]);

    const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    const openModal = (product: ProductRecord | null = null) => {
        setEditingProduct(product);
        setUploadError(null);
        setFormError(null);
        setFormData(product ? {
            title: product.title, description: product.description || '', price: product.price.toString(),
            stock_quantity: product.stock_quantity, low_stock_threshold: product.low_stock_threshold || 5, image_urls: product.image_urls || []
        } : { title: '', description: '', price: '', stock_quantity: 0, low_stock_threshold: 5, image_urls: [] });
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

    const handleSave = async () => {
        if (!shopId) return;
        setFormError(null);
        setIsSaving(true);
        try {
            const payload = {
                shop_id: shopId, title: formData.title, description: formData.description,
                price: parseFloat(formData.price), stock_quantity: formData.stock_quantity,
                low_stock_threshold: formData.low_stock_threshold,
                image_urls: formData.image_urls.filter(u => u.trim() !== '')
            };
            if (editingProduct) {
                const { error, data } = await supabase.from('products').update(payload).eq('id', editingProduct.id).select().single();
                if (error) throw error;
                if (data) setProducts(products.map(p => p.id === data.id ? data : p));
            } else {
                const { error, data } = await supabase.from('products').insert([payload]).select().single();
                if (error) throw error;
                if (data) setProducts([data, ...products]);
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

    const inStock = products.filter(p => p.stock_quantity > (p.low_stock_threshold || 5)).length;
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

            {/* Search */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-3 px-4 py-3">
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
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-bold text-gray-900">
                                                    Rs. {Number(product.price).toLocaleString()}
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
                                                            <AlertTriangle className="w-3 h-3" /> Low — {product.stock_quantity} left
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                                            <CheckCircle2 className="w-3 h-3" /> In Stock — {product.stock_quantity}
                                                        </span>
                                                    )}
                                                    <p className="text-[10px] text-gray-300 pl-0.5">Alert threshold: {product.low_stock_threshold || 5}</p>
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
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">

                            {uploadError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {uploadError}
                                </div>
                            )}

                            {formError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Product Images</label>

                                {/* Upload Area */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                            <span className="text-xs text-blue-500 font-medium">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition" />
                                            <span className="text-xs text-gray-400 group-hover:text-blue-500 font-medium transition">Click to upload image</span>
                                            <span className="text-[10px] text-gray-300">PNG, JPG, WEBP up to 5MB</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />

                                {/* Image Previews */}
                                {formData.image_urls.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {formData.image_urls.map((url, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 group/img shadow-sm">
                                                <img
                                                    src={url}
                                                    alt={`Product image ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '';
                                                        target.parentElement!.style.backgroundColor = '#f3f4f6';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(url)}
                                                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                                {idx === 0 && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[9px] text-center font-bold py-0.5">MAIN</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Or URL input */}
                                <div className="mt-3">
                                    <p className="text-xs text-gray-400 mb-1.5">Or paste image URL:</p>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val) {
                                                    setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, val] }));
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = e.target.value.trim();
                                            if (val) {
                                                setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, val] }));
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <p className="text-[10px] text-gray-300 mt-1">Press Enter or click away to add URL</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Product Title *</label>
                                <input type="text" required value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    placeholder="e.g. Premium Ceylon Cinnamon" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
                                <textarea value={formData.description} rows={3}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                                    placeholder="Describe the product..." />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Price (LKR) *</label>
                                    <input type="number" step="0.01" required value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Stock Qty</label>
                                    <input type="number" value={formData.stock_quantity}
                                        onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        placeholder="0" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                                    Low Stock Threshold <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                </label>
                                <p className="text-xs text-gray-400 mb-2">You&apos;ll see a warning when stock drops to this level.</p>
                                <input type="number" value={formData.low_stock_threshold}
                                    onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                                    placeholder="5" />
                            </div>
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
