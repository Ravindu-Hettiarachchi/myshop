import type { SupabaseClient } from '@supabase/supabase-js';

export const APP_ROLES = ['admin', 'shop_owner', 'customer'] as const;

export type AppRole = (typeof APP_ROLES)[number];

interface OwnerRoleRow {
    role: string | null;
}

interface ShopRow {
    id: string;
    route_path: string;
}

export function toAppRole(roleValue: string | null | undefined): AppRole {
    if (roleValue && APP_ROLES.includes(roleValue as AppRole)) {
        return roleValue as AppRole;
    }
    return 'customer';
}

export async function resolveUserRole(supabase: SupabaseClient, userId: string): Promise<AppRole> {
    const { data: ownerData } = await supabase
        .from('owners')
        .select('role')
        .eq('id', userId)
        .maybeSingle<OwnerRoleRow>();

    return toAppRole(ownerData?.role);
}

export async function getShopBySlug(supabase: SupabaseClient, slug: string): Promise<ShopRow | null> {
    const { data: shop } = await supabase
        .from('shops')
        .select('id, route_path')
        .eq('route_path', slug)
        .maybeSingle<ShopRow>();

    return shop ?? null;
}

export async function hasShopCustomerLink(
    supabase: SupabaseClient,
    args: { shopId: string; userId: string }
): Promise<boolean> {
    const { data } = await supabase
        .from('shop_customers')
        .select('id')
        .eq('shop_id', args.shopId)
        .eq('auth_user_id', args.userId)
        .maybeSingle<{ id: string }>();

    return Boolean(data?.id);
}
