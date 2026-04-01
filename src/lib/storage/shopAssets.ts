import type { SupabaseClient } from '@supabase/supabase-js';

export const SHOP_ASSETS_BUCKET = 'shop-assets';

interface UploadShopAssetParams {
    supabase: SupabaseClient;
    file: File;
    filePath: string;
    upsert?: boolean;
}

export interface UploadedShopAsset {
    storagePath: string;
    publicUrl: string;
}

const formatStorageErrorMessage = (message: string) => {
    const lower = message.toLowerCase();

    if (lower.includes('bucket not found') || lower.includes('bucket does not exist')) {
        return `Storage bucket "${SHOP_ASSETS_BUCKET}" is missing. Create it in Supabase Storage and retry.`;
    }

    if (lower.includes('permission') || lower.includes('row-level security') || lower.includes('not allowed')) {
        return `Upload permission denied for bucket "${SHOP_ASSETS_BUCKET}". Check Storage policies for authenticated shop owners.`;
    }

    return `Image upload failed: ${message}`;
};

export async function uploadToShopAssets({
    supabase,
    file,
    filePath,
    upsert = true,
}: UploadShopAssetParams): Promise<UploadedShopAsset> {
    const { error: uploadError } = await supabase.storage
        .from(SHOP_ASSETS_BUCKET)
        .upload(filePath, file, { upsert });

    if (uploadError) {
        throw new Error(formatStorageErrorMessage(uploadError.message));
    }

    const { data } = supabase.storage
        .from(SHOP_ASSETS_BUCKET)
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error(`Upload succeeded but public URL generation failed for bucket "${SHOP_ASSETS_BUCKET}".`);
    }

    return {
        storagePath: filePath,
        publicUrl: data.publicUrl,
    };
}
