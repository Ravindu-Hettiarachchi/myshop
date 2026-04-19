import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

const archiveSchema = z.object({
    productIds: z.array(z.string()).min(1, 'No products selected.'),
    isActive: z.boolean(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = archiveSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        const { data: shop } = await supabase
            .from('shops')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (!shop) {
            return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
        }

        // Toggle active status safely
        const { error } = await supabase
            .from('products')
            .update({ is_active: parsed.data.isActive, updated_at: new Date().toISOString() })
            .eq('shop_id', shop.id)
            .in('id', parsed.data.productIds);

        if (error) {
            return NextResponse.json({ error: 'Failed to update products status.' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}
