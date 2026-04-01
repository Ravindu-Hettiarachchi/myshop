'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import {
    buildStorefrontUrl,
    slugifyStorefrontLink,
    storefrontLinkSchema,
} from '@/lib/storefront';

const onboardingSchema = z.object({
    shopName: z.string().trim().min(2, 'Shop Name is required.'),
    routePath: storefrontLinkSchema,
    category: z.string().trim().min(1, 'Please select a business category.'),
});

type OnboardingErrors = {
    shopName?: string;
    routePath?: string;
    category?: string;
};

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [shopName, setShopName] = useState('');
    const [routePath, setRoutePath] = useState('');

    // We bind these variables to state just to fulfill the form visually for now
    const [category, setCategory] = useState('');
    const [brNumber, setBrNumber] = useState('');
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<OnboardingErrors>({});

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

        // 1. Get the current authenticated user driving this onboard
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            setErrorMsg("Authentication required. Please log in before registering a business.");
            setIsSubmitting(false);
            return;
        }

        // 2. Check if the owner record exists in the public.owners table
        const { error: ownerError } = await supabase
            .from('owners')
            .select('id')
            .eq('id', user.id)
            .single();

        if (ownerError && ownerError.code === 'PGRST116') {
            // Owner record doesn't exist, we must create it first before creating a shop
            const { error: insertOwnerError } = await supabase.from('owners').insert([{
                id: user.id,
                email: user.email,
                role: 'shop_owner'
            }]);

            if (insertOwnerError) {
                setErrorMsg("Failed to initialize your user profile: " + insertOwnerError.message);
                setIsSubmitting(false);
                return;
            }
        } else if (ownerError) {
            setErrorMsg("Error verifying user profile: " + ownerError.message);
            setIsSubmitting(false);
            return;
        }

        // 3. We don't have category, brNumber, or description in our DB schema right now, 
        // so we purposefully ignore them to protect the insert statement. We only push what fits!
        const { data: existingShop, error: existingShopError } = await supabase
            .from('shops')
            .select('id')
            .eq('route_path', normalizedRoutePath)
            .limit(1);

        if (existingShopError) {
            setErrorMsg('Unable to validate storefront link right now. Please try again.');
            setIsSubmitting(false);
            return;
        }

        if (existingShop && existingShop.length > 0) {
            setFieldErrors({ routePath: 'This storefront link is already taken. Please choose another.' });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            owner_id: user.id,
            shop_name: shopName.trim(),
            route_path: normalizedRoutePath,
            is_approved: false // Explicitly enforcing Pre-Live mode!
        }

        // 4. Connect to Supabase to inject shop
        const { error: insertError } = await supabase.from('shops').insert([payload]);

        if (insertError) {
            // Usually this throws if the routePath violates the UNIQUE database constraint we added
            if (insertError.code === '23505') {
                setFieldErrors({ routePath: 'This storefront link is already taken. Please choose another.' });
            } else {
                setErrorMsg(insertError.message);
            }
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        router.push(`/dashboard?created=1&route=${encodeURIComponent(normalizedRoutePath)}&url=${encodeURIComponent(buildStorefrontUrl(normalizedRoutePath))}`);
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="w-full bg-blue-50 border-b border-blue-100 py-3 px-4 flex justify-center">
                <p className="text-blue-800 text-sm font-medium">Step 2 of 2: Business Verification</p>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Tell us about your business</h1>
                    <p className="text-lg text-gray-500">We need a few details to verify your shop before provisioning your isolated storefront routing.</p>
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
                                        Registered Shop Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shopName"
                                            id="shopName"
                                            value={shopName}
                                            onChange={(e) => setShopName(e.target.value)}
                                            className={`shadow-sm focus:ring-blue-500 block w-full sm:text-sm rounded-md p-3 border ${fieldErrors.shopName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} text-gray-900 bg-white font-medium`}
                                            placeholder="e.g. Ceylon Spices Ltd."
                                        />
                                    </div>
                                    {fieldErrors.shopName && <p className="mt-1 text-sm text-red-500">{fieldErrors.shopName}</p>}
                                    <p className="mt-1 text-sm text-gray-500">This will be the official name displayed on your storefront.</p>
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
                                            name="routePath"
                                            id="routePath"
                                            value={routePath}
                                            onChange={(e) => setRoutePath(slugifyStorefrontLink(e.target.value))}
                                            onBlur={(e) => setRoutePath(slugifyStorefrontLink(e.target.value))}
                                            className={`flex-1 focus:ring-blue-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm p-2 border ${fieldErrors.routePath ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} text-gray-900 bg-white font-medium`}
                                            placeholder="ceylon-spices"
                                        />
                                    </div>
                                    {fieldErrors.routePath && <p className="mt-1 text-sm text-red-500">{fieldErrors.routePath}</p>}
                                    <p className="mt-1 text-sm text-blue-600 bg-blue-50 p-2 rounded inline-block font-medium">
                                        Module 1 Note: This route will be physically generated upon admin approval.
                                    </p>
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
                                            name="category"
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
                                        Business Registration (BR) Number
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="brNumber"
                                            id="brNumber"
                                            value={brNumber}
                                            onChange={(e) => setBrNumber(e.target.value)}
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
                                            name="description"
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

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`ml-3 inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                                >
                                    {isSubmitting ? 'Submitting Application...' : 'Submit for Verification'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
