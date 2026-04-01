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
    let role = 'customer';

    if (user) {
        // Fetch role from the owners table
        // Notice: This is simulating an RBAC join. 
        // In a strict production environment, mapping the role into user.app_metadata using a trigger is faster,
        // but fetching it in middleware works perfectly for accurate dynamic checks.
        const { data: ownerData } = await supabase
            .from('owners')
            .select('role')
            .eq('id', user.id)
            .single();

        if (ownerData) {
            role = ownerData.role;
        } else {
            role = 'shop_owner'; // Default assumption for fully signed in but unmapped profiles
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

    // 2. Shop Owner Paths (Dashboard, Onboarding)
    if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
        if (!user || (role !== 'shop_owner' && role !== 'admin')) {
            // Unauthenticated or non-shop owners are redirected
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    /* --------------------------------------------------------------------------
     * Optional Subdomain Routing (future opt-in)
     * Primary storefront mode is path-based: /shop/{route_path}
     * -------------------------------------------------------------------------- */
    const hostname = request.headers.get('host');
    const isProduction = process.env.NODE_ENV === 'production';
    const rootDomain = isProduction ? 'myshop.com' : 'localhost:3000'; // Replace myshop.com with actual production domain
    const enableSubdomainRouting = process.env.ENABLE_SUBDOMAIN_ROUTING === 'true';

    if (enableSubdomainRouting && hostname && hostname !== rootDomain && !hostname.startsWith('www.')) {
        // Extract the subdomain (e.g. 'ceylon-spices')
        const subdomain = hostname.replace(`.${rootDomain}`, '');

        // Prevent rewriting internal Next.js paths or API routes if they accidentally hit a subdomain
        if (!path.startsWith('/api') && !path.startsWith('/_next')) {

            if (path === '/') {
                // Rewrite mapping the root of the subdomain to the dynamic shop route
                const url = request.nextUrl.clone();
                url.pathname = `/shop/${subdomain}`;
                return NextResponse.rewrite(url);
            }

            // Allow explicit authentication paths on the subdomain for customers
            if (path.startsWith('/login') || path.startsWith('/signup')) {
                const url = request.nextUrl.clone();
                url.pathname = `/shop/${subdomain}${path}`;
                return NextResponse.rewrite(url);
            }

            // Fallback: Redirect unrecognized paths back to root of shop
            const url = request.nextUrl.clone();
            url.pathname = `/shop/${subdomain}`;
            return NextResponse.rewrite(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
