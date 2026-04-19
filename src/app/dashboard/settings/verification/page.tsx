'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from 'lucide-react';

export default function VerificationPage() {
    const router = useRouter();
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [brNumber, setBrNumber] = useState('');
    const [nicFiles, setNicFiles] = useState<File[]>([]);
    const [businessImages, setBusinessImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchShop = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('shops')
                .select('id, route_path, verification_status')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setShop(data);
                if (data.verification_status === 'pending' || data.verification_status === 'verified') {
                    router.replace('/dashboard/settings');
                }
            }
            setLoading(false);
        };
        fetchShop();
    }, [supabase, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>, max: number) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setter(prev => [...prev, ...newFiles].slice(0, max));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shop) return;
        setIsSubmitting(true);
        setErrorMsg(null);

        if (nicFiles.length === 0 || businessImages.length === 0) {
            setErrorMsg('Both NIC and Business Evidence images are required.');
            setIsSubmitting(false);
            return;
        }

        try {
            const uploadedNicUrls = await Promise.all(nicFiles.map(async (file) => {
                const ext = file.name.split('.').pop();
                const path = `${shop.route_path}/verification/nic_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const res = await uploadToShopAssets({ supabase, file, filePath: path });
                return res.publicUrl;
            }));

            const uploadedBusinessUrls = await Promise.all(businessImages.map(async (file) => {
                const ext = file.name.split('.').pop();
                const path = `${shop.route_path}/verification/biz_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const res = await uploadToShopAssets({ supabase, file, filePath: path });
                return res.publicUrl;
            }));

            const res = await fetch('/api/shops/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId: shop.id,
                    business_registration_no: brNumber,
                    business_images: uploadedBusinessUrls,
                    nic_files: uploadedNicUrls,
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                setErrorMsg(json.error || 'Failed to submit verification.');
                setIsSubmitting(false);
                return;
            }

            window.location.reload();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred during upload.');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Verification</h1>
                <p className="text-gray-500 text-sm mt-1">Submit your details to activate your storefront for public access.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-3 rounded border border-red-100 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Registration (BR) Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={brNumber}
                            onChange={(e) => setBrNumber(e.target.value)}
                            className="w-full rounded-lg border-gray-300 p-2.5 border text-sm"
                            placeholder="e.g. PV00123"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* NIC Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                NIC Images (Front & Back) <span className="text-red-500">*</span>
                            </label>
                            <label className="flex items-center justify-center w-full h-24 px-4 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                                <div className="flex flex-col items-center space-y-1">
                                    <UploadCloud className="w-5 h-5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500">Upload up to 2 images</span>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setNicFiles, 2)} />
                            </label>
                            <div className="mt-2 space-y-1">
                                {nicFiles.map((file, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-gray-100 p-1.5 rounded">
                                        <span className="truncate flex-1"><FileIcon className="w-3 h-3 inline mr-1 text-gray-400" />{file.name}</span>
                                        <button type="button" onClick={() => setNicFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-red-500" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Business Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Images (up to 3) <span className="text-red-500">*</span>
                            </label>
                            <label className="flex items-center justify-center w-full h-24 px-4 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                                <div className="flex flex-col items-center space-y-1">
                                    <UploadCloud className="w-5 h-5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500">Upload up to 3 images</span>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setBusinessImages, 3)} />
                            </label>
                            <div className="mt-2 space-y-1">
                                {businessImages.map((file, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs bg-gray-100 p-1.5 rounded">
                                        <span className="truncate flex-1"><FileIcon className="w-3 h-3 inline mr-1 text-gray-400" />{file.name}</span>
                                        <button type="button" onClick={() => setBusinessImages(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-red-500" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : <><CheckCircle2 className="w-4 h-4" /> Submit for Review</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
