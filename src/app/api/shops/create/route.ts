import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { buildStorefrontUrl, slugifyStorefrontLink, storefrontLinkSchema } from '@/lib/storefront';

const createShopSchema = z.object({
    shopName: z.string().trim().min(2, 'Shop name is required.'),
    routePath: z.string().trim().min(1, 'Storefront link is required.'),
    is_verify_flow: z.boolean().optional(),
    business_registration_no: z.string().optional(),
    business_images: z.array(z.string()).optional(),
    nic_files: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = createShopSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
        }

        const routePath = slugifyStorefrontLink(parsed.data.routePath);
        const validSlug = storefrontLinkSchema.safeParse(routePath);
        if (!validSlug.success) {
            return NextResponse.json({ error: validSlug.error.issues[0]?.message }, { status: 400 });
        }

        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        const { data: ownerData, error: ownerFetchError } = await supabase
            .from('owners')
            .select('id, role')
            .eq('id', user.id)
            .maybeSingle();

        if (ownerFetchError) {
            return NextResponse.json({ error: 'Unable to verify owner profile.' }, { status: 500 });
        }

        if (ownerData?.role === 'admin') {
            return NextResponse.json({ error: 'Admin accounts cannot create shops through onboarding.' }, { status: 403 });
        }

        if (!ownerData) {
            const { error: insertOwnerError } = await supabase.from('owners').insert([
                {
                    id: user.id,
                    email: user.email,
                    full_name: (user.user_metadata?.full_name as string | undefined) || null,
                    role: 'shop_owner',
                },
            ]);

            if (insertOwnerError) {
                return NextResponse.json({ error: 'Failed to initialize owner profile.' }, { status: 500 });
            }
        }

        const { data: existingShop, error: duplicateError } = await supabase
            .from('shops')
            .select('id')
            .eq('route_path', routePath)
            .limit(1);

        if (duplicateError) {
            return NextResponse.json({ error: 'Unable to validate storefront link right now.' }, { status: 500 });
        }

        if (existingShop && existingShop.length > 0) {
            return NextResponse.json({ error: 'This storefront link is already taken. Please choose another.' }, { status: 409 });
        }

        const payload = {
            owner_id: user.id,
            shop_name: parsed.data.shopName.trim(),
            route_path: routePath,
            is_approved: false,
            verification_status: parsed.data.is_verify_flow ? 'pending' : 'unverified',
            business_registration_no: parsed.data.business_registration_no || null,
            business_images: parsed.data.business_images || null,
            nic_files: parsed.data.nic_files || null,
        };

        const { error: insertShopError } = await supabase.from('shops').insert([payload]);

        if (insertShopError?.code === '23505') {
            return NextResponse.json({ error: 'This storefront link is already taken. Please choose another.' }, { status: 409 });
        }

        if (insertShopError) {
            return NextResponse.json({ error: insertShopError.message || 'Failed to create shop.' }, { status: 500 });
        }

        return NextResponse.json(
            {
                routePath,
                dashboardPath: `/dashboard/${routePath}`,
                storefrontUrl: buildStorefrontUrl(routePath),
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}
