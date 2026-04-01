import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getShopBySlug, hasShopCustomerLink, resolveUserRole, type AppRole } from "@/lib/auth/context";
import { CUSTOMER_AUTH_COOKIE_NAME } from "@/utils/supabase/customer";

function getShopSlugFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/shop\/([^/]+)/);
    return match?.[1] ?? null;
}

function buildShopLoginRedirect(request: NextRequest, slug: string, path: string): NextResponse {
    const loginUrl = new URL(`/shop/${slug}/login`, request.url);
    loginUrl.searchParams.set('next', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
}

function requireOwnerOrAdmin(args: { userId: string | null; role: AppRole; request: NextRequest; path: string }): NextResponse | null {
    if (!args.userId) {
        const loginUrl = new URL('/login', args.request.url);
        loginUrl.searchParams.set('next', `${args.path}${args.request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (args.role === 'shop_owner' || args.role === 'admin') {
        return null;
    }

    return NextResponse.redirect(new URL('/', args.request.url));
}

function requireAdmin(args: { userId: string | null; role: AppRole; request: NextRequest }): NextResponse | null {
    if (!args.userId) {
        return NextResponse.redirect(new URL('/login', args.request.url));
    }

    if (args.role !== 'admin') {
        return NextResponse.redirect(new URL('/', args.request.url));
    }

    return null;
}

async function requireCustomerForShop(args: {
    request: NextRequest;
    path: string;
    userId: string | null;
    supabase: ReturnType<typeof createServerClient>;
}): Promise<NextResponse | null> {
    const slug = getShopSlugFromPath(args.path);
    if (!slug) return null;

    if (!args.userId) {
        return buildShopLoginRedirect(args.request, slug, args.path);
    }

    const shop = await getShopBySlug(args.supabase, slug);
    if (!shop) {
        return NextResponse.redirect(new URL(`/shop/${slug}`, args.request.url));
    }

    const linked = await hasShopCustomerLink(args.supabase, {
        shopId: shop.id,
        userId: args.userId,
    });

    if (!linked) {
        return NextResponse.redirect(new URL(`/shop/${slug}`, args.request.url));
    }

    return null;
}

export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const ownerSupabase = createServerClient(
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

    const customerSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: CUSTOMER_AUTH_COOKIE_NAME,
            },
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

    // Refresh owner/admin auth session and get user
    const { data: { user: ownerUser } } = await ownerSupabase.auth.getUser();
    // Refresh customer storefront session and get user
    const { data: { user: customerUser } } = await customerSupabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const role = ownerUser ? await resolveUserRole(ownerSupabase, ownerUser.id) : 'customer';

    /* --------------------------------------------------------------------------
     * RBAC Routing Logic
     * -------------------------------------------------------------------------- */

    // 1. Admin Paths
    if (path.startsWith('/admin')) {
        const blocked = requireAdmin({ userId: ownerUser?.id ?? null, role, request });
        if (blocked) return blocked;
    }

    // 2. Shop Owner Paths (Dashboard)
    if (path.startsWith('/dashboard')) {
        const blocked = requireOwnerOrAdmin({ userId: ownerUser?.id ?? null, role, request, path });
        if (blocked) return blocked;
    }

    // 3. Onboarding should be blocked for admins, available for authenticated non-admin users.
    if (path.startsWith('/onboarding')) {
        if (!ownerUser) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    // 4. Protected customer shop routes (require login)
    const protectedShopRoute = /^\/shop\/[^/]+\/(checkout|orders|account|order\/[^/]+|invoice\/[^/]+)(\/)?$/;
    if (protectedShopRoute.test(path)) {
        const blocked = await requireCustomerForShop({
            request,
            path,
            userId: customerUser?.id ?? null,
            supabase: customerSupabase,
        });
        if (blocked) return blocked;
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
