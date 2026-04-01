import { createClient } from '@/utils/supabase/server';
import CheckoutClient from '@/components/shop/CheckoutClient';
import { redirect } from 'next/navigation';

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/shop/${slug}/login?next=${encodeURIComponent(`/shop/${slug}/checkout`)}`);
    }

    // 1. Verify Shop
    const { data: shop } = await supabase.from('shops').select('*').eq('route_path', slug).single();
    if (!shop) return <div className="p-8 text-center">Store not found</div>;

    // 2. Checkout UI is handled by client component after auth guard.

    return (
        <div className={`min-h-screen ${shop.template === 'modern-dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'} py-12 px-4 sm:px-6 lg:px-8 font-sans`}>
            {/* The actual checkout form logic resides in the CheckoutClient */}
            <CheckoutClient shop={shop} />
        </div>
    );
}
