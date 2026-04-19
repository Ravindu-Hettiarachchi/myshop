import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const verifyShopSchema = z.object({
    shopId: z.string().trim().min(1, 'Shop ID is required.'),
    business_registration_no: z.string().optional(),
    business_images: z.array(z.string()).optional(),
    nic_files: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = verifyShopSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        // Verify ownership and current status
        const { data: shop, error: fetchError } = await supabase
            .from('shops')
            .select('id, owner_id, verification_status')
            .eq('id', parsed.data.shopId)
            .maybeSingle();

        if (fetchError || !shop) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        if (shop.owner_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        if (shop.verification_status === 'pending' || shop.verification_status === 'verified') {
            return NextResponse.json({ error: 'Shop verification is already pending or verified.' }, { status: 400 });
        }

        // Update the shop
        const { error: updateError } = await supabase
            .from('shops')
            .update({
                verification_status: 'pending',
                business_registration_no: parsed.data.business_registration_no || null,
                business_images: parsed.data.business_images || null,
                nic_files: parsed.data.nic_files || null,
            })
            .eq('id', shop.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to submit verification details.' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}
