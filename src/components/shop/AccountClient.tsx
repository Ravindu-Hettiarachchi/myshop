'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function AccountClient({ slug }: { slug: string }) {
    const supabase = createClient();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push(`/shop/${slug}`);
        router.refresh(); // Clear server cache
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition-colors"
        >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
        </button>
    );
}
