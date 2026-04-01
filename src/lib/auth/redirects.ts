import type { SupabaseClient } from '@supabase/supabase-js';

const APP_ROLES = ['admin', 'shop_owner', 'customer'] as const;

export type AppRole = (typeof APP_ROLES)[number];

interface ResolvePostLoginRedirectParams {
    supabase: SupabaseClient;
    userId: string;
    preferredPath?: string | null;
}

interface RoleRecord {
    role: string | null;
}

interface ShopRouteRecord {
    route_path: string | null;
}

export interface LoginRedirectResolution {
    role: AppRole;
    target: string;
    shopSlug: string | null;
}

const isSafeRelativePath = (value: string) => value.startsWith('/') && !value.startsWith('//');

const normalizePreferredPath = (preferredPath?: string | null): string | null => {
    if (!preferredPath) return null;

    let decoded = preferredPath;
    try {
        decoded = decodeURIComponent(preferredPath);
    } catch {
        decoded = preferredPath;
    }

    if (!isSafeRelativePath(decoded)) return null;
    if (decoded.startsWith('/auth/callback')) return null;
    return decoded;
};

const toRole = (roleValue: string | null | undefined): AppRole => {
    if (roleValue && APP_ROLES.includes(roleValue as AppRole)) {
        return roleValue as AppRole;
    }
    return 'customer';
};

const resolveAdminTarget = (preferredPath: string | null) => {
    if (preferredPath?.startsWith('/admin')) return preferredPath;
    return '/admin';
};

const resolveShopOwnerTarget = (preferredPath: string | null, shopSlug: string | null) => {
    if (preferredPath === '/setup' || preferredPath?.startsWith('/onboarding')) {
        return preferredPath;
    }

    if (!shopSlug) {
        return '/setup';
    }

    if (preferredPath === '/dashboard' || preferredPath?.startsWith('/dashboard/')) {
        return `/dashboard/${shopSlug}`;
    }

    return `/dashboard/${shopSlug}`;
};

const resolveCustomerTarget = (preferredPath: string | null) => preferredPath ?? '/';

export async function resolvePostLoginRedirect({
    supabase,
    userId,
    preferredPath,
}: ResolvePostLoginRedirectParams): Promise<LoginRedirectResolution> {
    const safePreferredPath = normalizePreferredPath(preferredPath);

    const { data: ownerData } = await supabase
        .from('owners')
        .select('role')
        .eq('id', userId)
        .maybeSingle<RoleRecord>();

    const role = toRole(ownerData?.role);

    if (role === 'admin') {
        return {
            role,
            target: resolveAdminTarget(safePreferredPath),
            shopSlug: null,
        };
    }

    if (role === 'shop_owner') {
        const { data: shop } = await supabase
            .from('shops')
            .select('route_path')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle<ShopRouteRecord>();

        const shopSlug = shop?.route_path?.trim() || null;
        return {
            role,
            target: resolveShopOwnerTarget(safePreferredPath, shopSlug),
            shopSlug,
        };
    }

    return {
        role,
        target: resolveCustomerTarget(safePreferredPath),
        shopSlug: null,
    };
}
