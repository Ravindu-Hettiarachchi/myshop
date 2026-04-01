'use client';

import { createCustomerClient } from '@/utils/supabase/customer-client';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton({ slug }: { slug: string }) {
    const supabase = createCustomerClient();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push(`/shop/${slug}`);
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
        </button>
    );
}

export function CancelOrderButton({ orderId, onCancelled }: { orderId: string; onCancelled: () => void }) {
    const supabase = createCustomerClient();
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
        setIsCancelling(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);
            if (error) throw error;
            onCancelled();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to cancel order: ${message}`);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
            {isCancelling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />
            }
            Cancel Order
        </button>
    );
}

// Default export kept for backward compatibility (legacy sign-out button)
export default function AccountClient({ slug }: { slug: string }) {
    return <LogoutButton slug={slug} />;
}
