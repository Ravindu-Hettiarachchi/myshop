import { z } from 'zod';

export const STOREFRONT_LINK_MIN = 3;
export const STOREFRONT_LINK_MAX = 40;

export const storefrontLinkSchema = z
    .string()
    .trim()
    .min(STOREFRONT_LINK_MIN, `Storefront link must be at least ${STOREFRONT_LINK_MIN} characters.`)
    .max(STOREFRONT_LINK_MAX, `Storefront link must be ${STOREFRONT_LINK_MAX} characters or less.`)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Storefront link can only contain lowercase letters, numbers, and hyphens.'
    );

export function slugifyStorefrontLink(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function buildStorefrontUrl(routePath: string): string {
    const sanitizedRoute = slugifyStorefrontLink(routePath);
    const configuredBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
    const runtimeBase =
        typeof window !== 'undefined'
            ? window.location.origin
            : configuredBase || 'http://localhost:3000';

    return `${runtimeBase}/shop/${sanitizedRoute}`;
}
