import { createBrowserClient } from '@supabase/ssr';
import { CUSTOMER_AUTH_COOKIE_NAME } from './customer';

export function createCustomerClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: CUSTOMER_AUTH_COOKIE_NAME,
            },
            isSingleton: false,
        }
    );
}
