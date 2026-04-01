import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh auth session and get user
    const { data: { user } } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    let role: 'admin' | 'shop_owner' | 'customer' = 'customer';

    if (user) {
        // Fetch role from the owners table
        // Notice: This is simulating an RBAC join. 
        // In a strict production environment, mapping the role into user.app_metadata using a trigger is faster,
        // but fetching it in middleware works perfectly for accurate dynamic checks.
        const { data: ownerData } = await supabase
            .from('owners')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (ownerData?.role === 'admin' || ownerData?.role === 'shop_owner' || ownerData?.role === 'customer') {
            role = ownerData.role;
        }
    }

    /* --------------------------------------------------------------------------
     * RBAC Routing Logic
     * -------------------------------------------------------------------------- */

    // 1. Admin Paths
    if (path.startsWith('/admin')) {
        if (role !== 'admin') {
            // Redirect non-admins trying to access admin console (perhaps with a 403 or fallback to login)
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. Shop Owner Paths (Dashboard)
    if (path.startsWith('/dashboard')) {
        if (!user || role !== 'shop_owner') {
            if (user && role === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            // Unauthenticated or non-shop owners are redirected
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 3. Onboarding should be blocked for admins, available for authenticated non-admin users.
    if (path.startsWith('/onboarding')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    /* --------------------------------------------------------------------------
     * Subdomain Routing (customer storefront): bike.myshop.com -> /shop/bike
     * -------------------------------------------------------------------------- */
    const hostname = request.headers.get('host');
    const host = (hostname ?? '').split(':')[0].toLowerCase();
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'myshop.com').toLowerCase();

    const isRootHost =
        host === rootDomain ||
        host === `www.${rootDomain}` ||
        host === 'localhost' ||
        host === '127.0.0.1';

    let subdomain: string | null = null;

    if (!isRootHost) {
        if (host.endsWith(`.${rootDomain}`) && !host.startsWith('admin.') && !host.startsWith('www.')) {
            subdomain = host.replace(`.${rootDomain}`, '');
        } else if (host.endsWith('.localhost')) {
            subdomain = host.replace('.localhost', '');
        }
    }

    if (subdomain && !path.startsWith('/api') && !path.startsWith('/_next') && !path.startsWith('/shop/')) {
        const url = request.nextUrl.clone();
        url.pathname = path === '/' ? `/shop/${subdomain}` : `/shop/${subdomain}${path}`;
        return NextResponse.rewrite(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
