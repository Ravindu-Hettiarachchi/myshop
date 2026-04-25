import { createBrowserClient } from '@supabase/ssr';
import { CUSTOMER_AUTH_COOKIE_NAME } from './customer';

// Module-level singleton — one Supabase client per browser tab.
// Multiple instances compete for the same IndexedDB auth lock and
// cause "Lock broken by another request with the 'steal' option".
let _customerClient: ReturnType<typeof createBrowserClient> | null = null;

export function createCustomerClient() {
    if (_customerClient) return _customerClient;

    _customerClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: CUSTOMER_AUTH_COOKIE_NAME,
            },
        }
    );

    return _customerClient;
}
