import { z } from 'zod';

export const PRODUCT_UNITS = ['item', 'kg', 'g', 'litre', 'ml', 'pack'] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

const UNIT_LABELS: Record<ProductUnit, string> = {
    item: 'item',
    kg: 'kg',
    g: 'g',
    litre: 'litre',
    ml: 'ml',
    pack: 'pack',
};

export const DEFAULT_PRODUCT_UNIT: ProductUnit = 'item';
export const DEFAULT_UNIT_VALUE = 1;
export const DEFAULT_STOCK_UNIT: ProductUnit = 'item';

type UnitCategory = 'mass' | 'volume' | 'count';

function getUnitCategory(unit: ProductUnit): UnitCategory {
    if (unit === 'kg' || unit === 'g') return 'mass';
    if (unit === 'litre' || unit === 'ml') return 'volume';
    return 'count';
}

function getBaseFactor(unit: ProductUnit): number {
    switch (unit) {
        case 'kg':
            return 1000;
        case 'litre':
            return 1000;
        default:
            return 1;
    }
}

export function canConvertUnits(fromUnit: ProductUnit, toUnit: ProductUnit): boolean {
    return getUnitCategory(fromUnit) === getUnitCategory(toUnit);
}

export function convertQuantity(quantity: number, fromUnit: ProductUnit, toUnit: ProductUnit): number {
    if (!canConvertUnits(fromUnit, toUnit)) return quantity;

    const normalizedQuantity = normalizeUnitValue(quantity);
    const baseValue = normalizedQuantity * getBaseFactor(fromUnit);
    return baseValue / getBaseFactor(toUnit);
}

export function normalizeProductUnit(unit: string | null | undefined): ProductUnit {
    if (!unit) return DEFAULT_PRODUCT_UNIT;
    return PRODUCT_UNITS.includes(unit as ProductUnit) ? (unit as ProductUnit) : DEFAULT_PRODUCT_UNIT;
}

export const normalizeSellingUnit = normalizeProductUnit;

export function normalizeStockUnit(unit: string | null | undefined): ProductUnit {
    if (!unit) return DEFAULT_STOCK_UNIT;
    return PRODUCT_UNITS.includes(unit as ProductUnit) ? (unit as ProductUnit) : DEFAULT_STOCK_UNIT;
}

export function getUnitLabel(unit: string | null | undefined): string {
    const normalized = normalizeProductUnit(unit);
    return UNIT_LABELS[normalized];
}

export function normalizeUnitValue(value: number | string | null | undefined): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_UNIT_VALUE;
    return parsed;
}

export function formatUnitValue(value: number | string | null | undefined): string {
    const normalized = normalizeUnitValue(value);
    if (Number.isInteger(normalized)) return normalized.toString();
    return normalized.toString();
}

export function formatQuantityLabel(
    quantity: number | string | null | undefined,
    unit: string | null | undefined
): string {
    const normalizedQuantity = normalizeUnitValue(quantity);
    const normalizedUnit = normalizeProductUnit(unit);

    if (normalizedUnit === 'item') {
        const suffix = normalizedQuantity === 1 ? 'item' : 'items';
        return `${formatUnitValue(normalizedQuantity)} ${suffix}`;
    }

    return `${formatUnitValue(normalizedQuantity)}${getUnitLabel(normalizedUnit)}`;
}

export function formatPriceWithUnit(
    price: number,
    sellingUnit: string | null | undefined,
    sellingUnitValue: number | string | null | undefined
): string {
    return `Rs. ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function formatStockWithUnit(stockQuantity: number, stockUnit: string | null | undefined): string {
    return `${Number(stockQuantity).toLocaleString()}${getUnitLabel(stockUnit)}`;
}

export const variantSchema = z.object({
    id: z.string().optional(),
    sku: z.string().optional().nullable().or(z.literal('')),
    options: z.record(z.string(), z.string()),
    price_override: z.coerce.number().optional().nullable(),
    compare_at_price: z.coerce.number().optional().nullable(),
    stock_quantity: z.coerce.number().min(0).default(0),
    image_url: z.string().url().optional().nullable().or(z.literal('')),
});

export const productUpsertSchema = z.object({
    title: z.string().trim().min(1, 'Product title is required.'),
    description: z.string().optional().default(''),
    price: z.coerce.number().gt(0, 'Price must be greater than 0.'),
    compare_at_price: z.coerce.number().optional().nullable(),
    selling_unit_value: z.coerce.number().gt(0, 'Selling unit value must be greater than 0.'),
    selling_unit: z.enum(PRODUCT_UNITS, { error: 'Selling unit is required.' }),
    stock_quantity: z.coerce.number().min(0, 'Stock quantity cannot be negative.'),
    stock_unit: z.enum(PRODUCT_UNITS, { error: 'Stock unit is required.' }),
    low_stock_threshold: z.coerce.number().min(0, 'Low stock threshold cannot be negative.'),
    image_urls: z.array(z.string().url()).default([]),
    has_variants: z.boolean().default(false),
    variation_options: z.array(z.object({
        name: z.string(),
        values: z.array(z.string())
    })).default([]),
    variants: z.array(variantSchema).default([]),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
