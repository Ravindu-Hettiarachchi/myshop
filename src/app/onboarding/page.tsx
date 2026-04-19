'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { slugifyStorefrontLink, storefrontLinkSchema } from '@/lib/storefront';
import { createClient } from '@/utils/supabase/client';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

const onboardingSchema = z.object({
    shopName: z.string().trim().min(2, 'Shop Name is required.'),
    routePath: storefrontLinkSchema,
    category: z.string().trim().min(1, 'Please select a business category.'),
});

type OnboardingErrors = {
    shopName?: string;
    routePath?: string;
    category?: string;
    nicFiles?: string;
    businessImages?: string;
};

function OnboardingForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVerifyFlow = searchParams.get('verify') === 'true';
    const supabase = createClient();

    const [shopName, setShopName] = useState('');
    const [routePath, setRoutePath] = useState('');
    const [category, setCategory] = useState('');
    const [brNumber, setBrNumber] = useState('');
    const [description, setDescription] = useState('');
    
    const [nicFiles, setNicFiles] = useState<File[]>([]);
    const [businessImages, setBusinessImages] = useState<File[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<OnboardingErrors>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>, max: number) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setter(prev => [...prev, ...newFiles].slice(0, max));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);
        setFieldErrors({});

        const normalizedRoutePath = slugifyStorefrontLink(routePath);
        setRoutePath(normalizedRoutePath);

        const validation = onboardingSchema.safeParse({
            shopName,
            routePath: normalizedRoutePath,
            category,
        });

        if (!validation.success) {
            const errors: OnboardingErrors = {};
            for (const issue of validation.error.issues) {
                const field = issue.path[0] as keyof OnboardingErrors;
                errors[field] = issue.message;
            }
            setFieldErrors(errors);
            setIsSubmitting(false);
            return;
        }

        if (isVerifyFlow) {
            if (nicFiles.length === 0) {
                setFieldErrors({ nicFiles: 'Please upload at least 1 NIC image (Front/Back).' });
                setIsSubmitting(false);
                return;
            }
            if (businessImages.length === 0) {
                setFieldErrors({ businessImages: 'Please upload at least 1 business evidence image.' });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            let uploadedNicUrls: string[] = [];
            let uploadedBusinessUrls: string[] = [];

            if (isVerifyFlow) {
                // Upload NICs
                uploadedNicUrls = await Promise.all(nicFiles.map(async (file) => {
                    const ext = file.name.split('.').pop();
                    const path = `${normalizedRoutePath}/verification/nic_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                    const res = await uploadToShopAssets({ supabase, file, filePath: path });
                    return res.publicUrl;
                }));

                // Upload Business Images
                uploadedBusinessUrls = await Promise.all(businessImages.map(async (file) => {
                    const ext = file.name.split('.').pop();
                    const path = `${normalizedRoutePath}/verification/biz_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                    const res = await uploadToShopAssets({ supabase, file, filePath: path });
                    return res.publicUrl;
                }));
            }

            const res = await fetch('/api/shops/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopName,
                    routePath: normalizedRoutePath,
                    is_verify_flow: isVerifyFlow,
                    business_registration_no: brNumber,
                    business_images: uploadedBusinessUrls.length > 0 ? uploadedBusinessUrls : undefined,
                    nic_files: uploadedNicUrls.length > 0 ? uploadedNicUrls : undefined,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    setFieldErrors({ routePath: 'This storefront link is already taken. Please choose another.' });
                } else {
                    setErrorMsg(json.error || 'Failed to create your shop.');
                }
                setIsSubmitting(false);
                return;
            }

            setIsSubmitting(false);
            router.push(json.dashboardPath || `/dashboard/${normalizedRoutePath}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to process files. Please check network.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="w-full bg-blue-50 border-b border-blue-100 py-3 px-4 flex justify-center">
                <p className="text-blue-800 text-sm font-medium">Step 2 of 2: {isVerifyFlow ? 'Business Verification' : 'Store Setup'}</p>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Tell us about your business</h1>
                    <p className="text-lg text-gray-500">
                        {isVerifyFlow 
                            ? 'Complete your verification to launch your shop live securely and instantly.' 
                            : 'Set up your basic storefront. You can verify your business identity later to go live.'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {errorMsg && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <p className="text-sm text-red-700">{errorMsg}</p>
                            </div>
                        )}

                        {/* Section 1 */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Store Identity</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-6">
                                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                                        Store Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="shopName"
                                            value={shopName}
                                            onChange={(e) => setShopName(e.target.value)}
                                            className={`shadow-sm focus:ring-blue-500 block w-full sm:text-sm rounded-md p-3 border ${fieldErrors.shopName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} text-gray-900 bg-white font-medium`}
                                            placeholder="e.g. Ceylon Spices Ltd."
                                        />
                                    </div>
                                    {fieldErrors.shopName && <p className="mt-1 text-sm text-red-500">{fieldErrors.shopName}</p>}
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="routePath" className="block text-sm font-medium text-gray-700">
                                        Desired Storefront Link <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-4 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            myshop.com/shop/
                                        </span>
                                        <input
                                            type="text"
                                            id="routePath"
                                            value={routePath}
                                            onChange={(e) => setRoutePath(slugifyStorefrontLink(e.target.value))}
                                            onBlur={(e) => setRoutePath(slugifyStorefrontLink(e.target.value))}
                                            className={`flex-1 focus:ring-blue-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm p-2 border ${fieldErrors.routePath ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} text-gray-900 bg-white font-medium`}
                                            placeholder="ceylon-spices"
                                        />
                                    </div>
                                    {fieldErrors.routePath && <p className="mt-1 text-sm text-red-500">{fieldErrors.routePath}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="pt-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Business Details</h3>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                        Business Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className={`shadow-sm focus:ring-blue-500 block w-full sm:text-sm rounded-md p-3 border ${fieldErrors.category ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} text-gray-900 bg-white font-medium`}
                                        >
                                            <option value="">Select a category</option>
                                            <option value="clothing">Clothing & Apparel</option>
                                            <option value="food">Food & Groceries</option>
                                            <option value="electronics">Electronics</option>
                                            <option value="handicrafts">Handicrafts</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    {fieldErrors.category && <p className="mt-1 text-sm text-red-500">{fieldErrors.category}</p>}
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="brNumber" className="block text-sm font-medium text-gray-700">
                                        Business Registration (BR) Number {isVerifyFlow ? <span className="text-red-500">*</span> : ''}
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="brNumber"
                                            value={brNumber}
                                            onChange={(e) => setBrNumber(e.target.value)}
                                            required={isVerifyFlow}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border text-gray-900 bg-white font-medium"
                                            placeholder="e.g. PV00123"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Shop Description
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="description"
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3 text-gray-900 bg-white font-medium"
                                            placeholder="Tell us briefly about what you sell..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Uploads for Verify Flow */}
                        {isVerifyFlow && (
                            <div className="pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Identity & Verification</h3>
                                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-6">
                                    {/* NIC */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Owner NIC (Front & Back) <span className="text-red-500">*</span>
                                        </label>
                                        <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                                            <div className="flex flex-col items-center space-y-1">
                                                <UploadCloud className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium text-gray-600 text-xs">Drop files, or click to browse</span>
                                            </div>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setNicFiles, 2)} />
                                        </label>
                                        <div className="mt-2 space-y-2">
                                            {nicFiles.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                                    <div className="flex items-center gap-2 truncate"><FileIcon className="w-3 h-3 text-gray-400" /> <span className="truncate">{file.name}</span></div>
                                                    <button type="button" onClick={() => setNicFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-red-500" /></button>
                                                </div>
                                            ))}
                                        </div>
                                        {fieldErrors.nicFiles && <p className="mt-1 text-sm text-red-500">{fieldErrors.nicFiles}</p>}
                                    </div>

                                    {/* Business Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Evidence (up to 3) <span className="text-red-500">*</span>
                                        </label>
                                        <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                                            <div className="flex flex-col items-center space-y-1">
                                                <UploadCloud className="w-5 h-5 text-gray-400" />
                                                <span className="font-medium text-gray-600 text-xs">Drop files, or click to browse</span>
                                            </div>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setBusinessImages, 3)} />
                                        </label>
                                        <div className="mt-2 space-y-2">
                                            {businessImages.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                                    <div className="flex items-center gap-2 truncate"><FileIcon className="w-3 h-3 text-gray-400" /> <span className="truncate">{file.name}</span></div>
                                                    <button type="button" onClick={() => setBusinessImages(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-red-500" /></button>
                                                </div>
                                            ))}
                                        </div>
                                        {fieldErrors.businessImages && <p className="mt-1 text-sm text-red-500">{fieldErrors.businessImages}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`ml-3 inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                                >
                                    {isSubmitting ? 'Processing...' : (isVerifyFlow ? 'Submit & Verify' : 'Create Shop Setup')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <OnboardingForm />
        </Suspense>
    );
}
