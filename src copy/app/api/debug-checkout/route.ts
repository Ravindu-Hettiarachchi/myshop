import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    const body = await req.json();

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
            shop_id: body.shop_id,
            customer_email: body.customer_email,
            total_amount: body.total_amount,
            status: 'processing'
        }])
        .select()
        .single();

    return NextResponse.json({ orderData, orderError });
}
