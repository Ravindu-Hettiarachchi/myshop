'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { uploadToShopAssets } from '@/lib/storage/shopAssets';
import { UploadCloud, File as FileIcon, X, CheckCircle2 } from 'lucide-react';

export default function AccountPage() {
    const router = useRouter();
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [shop, setShop] = useState<any>(null);
    const [owner, setOwner] = useState<{full_name: string, email: string} | null>(null);
    const [loading, setLoading] = useState(true);

    const [brNumber, setBrNumber] = useState('');
    const [nicFiles, setNicFiles] = useState<File[]>([]);
    const [businessImages, setBusinessImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Security Profile State
    const [newPassword, setNewPassword] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [profileMsg, setProfileMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        const fetchShop = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('shops')
                .select('id, route_path, verification_status, business_registration_no, business_images, nic_files')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
                
            const { data: ownerData } = await supabase
                .from('owners')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();
                
            if (ownerData) {
                setOwner({ full_name: ownerData.full_name || 'Shop Owner', email: user.email || '' });
                setNewFullName(ownerData.full_name || 'Shop Owner');
            }

            if (data) {
                setShop(data);
                setBrNumber(data.business_registration_no || '');
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

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        setProfileMsg(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            let promises = [];
            
            // Update Auth Password if provided
            if (newPassword) {
                promises.push(supabase.auth.updateUser({ password: newPassword }));
            }
            
            // Update Full Name in owners table
            if (newFullName && newFullName !== owner?.full_name) {
                promises.push(supabase.from('owners').update({ full_name: newFullName }).eq('id', user.id));
            }
            
            await Promise.all(promises);
            setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
            setOwner(prev => prev ? { ...prev, full_name: newFullName } : prev);
            setNewPassword('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
        }
        setIsUpdatingProfile(false);
    };

    const rejectionData = React.useMemo(() => {
        if (!shop?.verification_status?.startsWith('rejected|')) return null;
        try {
            return JSON.parse(shop.verification_status.split('|')[1]);
        } catch {
            return null;
        }
    }, [shop]);

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

    const baseStatus = shop?.verification_status?.split('|')[0] || 'unverified';
    const isPending = baseStatus === 'pending';
    const isVerified = baseStatus === 'verified';
    const isRejected = baseStatus === 'rejected';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account details</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your shop owner account and verification status.</p>
            </div>
            
            {/* Security Profile Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3">Security & Profile</h2>
                {profileMsg && (
                    <div className={`mb-4 p-3 rounded text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {profileMsg.text}
                    </div>
                )}
                
                {owner && (
                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-5 items-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md shrink-0">
                                {owner.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read Only)</label>
                                    <input type="text" disabled value={owner.email} className="w-full rounded-lg bg-gray-50 border-gray-200 p-2.5 border text-sm text-gray-500" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" required value={newFullName} onChange={e => setNewFullName(e.target.value)} className="w-full rounded-lg border-gray-300 p-2.5 border text-sm focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep)</label>
                                        <input type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-lg border-gray-300 p-2.5 border text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isUpdatingProfile} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
                                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            <div className="pt-4 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Verification</h2>

                {/* 3 Step Verification Tracker */}
                <div className="w-full max-w-2xl mx-auto mb-10 relative">
                    <div className="flex justify-between items-center text-xs font-semibold relative z-10">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${(isPending || isVerified || isRejected) ? 'bg-blue-600' : 'bg-gray-300'}`}>1</div>
                            <span className={(isPending || isVerified || isRejected) ? 'text-blue-700' : 'text-gray-400'}>Documents Submitted</span>
                        </div>
                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${(isVerified || isRejected) ? 'bg-blue-600' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}>2</div>
                            <span className={(isVerified || isRejected) ? 'text-blue-700' : isPending ? 'text-amber-600' : 'text-gray-400'}>Admin Review</span>
                        </div>
                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${isVerified ? 'bg-emerald-500' : isRejected ? 'bg-red-500' : 'bg-gray-300'}`}>3</div>
                            <span className={isVerified ? 'text-emerald-600' : isRejected ? 'text-red-600' : 'text-gray-400'}>
                                {isVerified ? 'Approved' : isRejected ? 'Rejected' : 'Final Status'}
                            </span>
                        </div>
                    </div>
                    {/* Connecting Line */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
                        <div className={`h-full bg-blue-600 transition-all duration-500 ${(isVerified || isRejected) ? 'w-full' : isPending ? 'w-1/2 bg-gradient-to-r from-blue-600 to-amber-500' : 'w-0'}`} />
                    </div>
                </div>

                {rejectionData && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg mb-6 shadow-sm">
                        <h2 className="text-red-800 font-bold mb-2 text-lg">Verification Action Required</h2>
                        <p className="text-sm text-red-700 mb-3">Your previous submission was not approved for the following reasons:</p>
                        <ul className="list-disc list-inside text-sm text-red-700 font-medium mb-3 ml-2 space-y-1">
                            {rejectionData.NIC && <li>Invalid NIC/ID Documentation</li>}
                            {rejectionData.Biz && <li>Invalid Business Evidence Images</li>}
                            {rejectionData.BR && <li>Unverifiable Business Registration Number (BR)</li>}
                        </ul>
                        {rejectionData.msg && (
                            <div className="text-sm text-red-800 bg-red-100 p-3 rounded mt-2 border border-red-200">
                                <strong>Additional Note from Admin:</strong>
                                <p className="mt-1 whitespace-pre-wrap">{rejectionData.msg}</p>
                            </div>
                        )}
                        <p className="text-sm font-medium text-red-800 mt-4">Please fix these issues and resubmit using the form below.</p>
                    </div>
                )}

                {/* Conditional Rendering based on state */}
                {(isPending || isVerified) ? (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 mb-6 shadow-sm">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Business Reg Number</span>
                            <span className="font-bold text-gray-900 border-b-2 border-slate-900">{brNumber}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> NIC Uploads</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(shop.nic_files || []).map((url: string, i: number) => (
                                        <a href={url} target="_blank" rel="noreferrer" key={i} className="aspect-video bg-gray-200 rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition relative group block">
                                            <img src={url} className="w-full h-full object-cover" alt="NIC" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">View</div>
                                        </a>
                                    ))}
                                    {(!shop.nic_files || shop.nic_files.length === 0) && <p className="text-xs text-gray-400">No images</p>}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Business Evidence</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(shop.business_images || []).map((url: string, i: number) => (
                                        <a href={url} target="_blank" rel="noreferrer" key={i} className="aspect-video bg-gray-200 rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition relative group block">
                                            <img src={url} className="w-full h-full object-cover" alt="Business Evidence" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">View</div>
                                        </a>
                                    ))}
                                    {(!shop.business_images || shop.business_images.length === 0) && <p className="text-xs text-gray-400">No images</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-3xl mx-auto">
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
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-200"
                            >
                                {isSubmitting ? 'Submitting...' : <><CheckCircle2 className="w-4 h-4" /> Submit for Review</>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
