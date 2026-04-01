import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CUSTOMER_AUTH_COOKIE_NAME } from './customer';

export async function createCustomerServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: CUSTOMER_AUTH_COOKIE_NAME,
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignore when called from Server Components without response mutation.
                    }
                },
            },
        }
    );
}
