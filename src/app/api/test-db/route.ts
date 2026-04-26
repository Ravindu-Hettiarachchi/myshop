import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data, error } = await supabase.from('shops').select('*, owner:owners!owner_id(email, full_name)').limit(1);
        if (error) return NextResponse.json({ db_error: error });
        
        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ fail: e.message });
    }
}
