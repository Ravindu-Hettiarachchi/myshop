import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const adjustSchema = z.object({
    adjustments: z.array(z.object({
        productId: z.string().trim().min(1, 'Product ID is required.'),
        delta: z.number(),
        reason: z.string().trim().max(100).optional().default('MANUAL_ADJUSTMENT'),
        referenceId: z.string().trim().max(100).optional().nullable(),
    })).min(1, 'No adjustments provided.'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = adjustSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        // Validate that all products belong to the user's shop
        const productIds = parsed.data.adjustments.map(a => a.productId);
        
        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        const { data: products, error: productError } = await supabase
            .from('products')
            .select('id')
            .eq('shop_id', shop.id)
            .in('id', productIds);

        if (productError || !products || products.length !== productIds.length) {
            return NextResponse.json({ error: 'One or more products do not belong to you or do not exist.' }, { status: 403 });
        }

        const results = [];
        const errors = [];

        for (const adj of parsed.data.adjustments) {
            const { data, error } = await supabase.rpc('adjust_stock', {
                p_product_id: adj.productId,
                p_delta: adj.delta,
                p_reason: adj.reason,
                p_reference_id: adj.referenceId || null
            });

            if (error) {
                errors.push({ productId: adj.productId, error: error.message });
            } else {
                results.push({ productId: adj.productId, data });
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ success: false, results, errors }, { status: 400 });
        }

        return NextResponse.json({ success: true, results }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}
