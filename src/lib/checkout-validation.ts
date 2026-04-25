/**
 * Sri Lankan Checkout Validation Schemas (2026 Standards)
 * Uses Zod v4 for strict TypeScript-first validation
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Phone validation — Sri Lanka mobile numbers
// Accepted: 07XXXXXXXX (10 digits) OR +947XXXXXXXX
// Valid prefixes: 070, 071, 072, 074, 075, 076, 077, 078
// ---------------------------------------------------------------------------

export const slPhoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => /^07[0-8][0-9]{7}$/.test(val), {
    message: 'Phone number must start with 070–078 and contain exactly 10 digits',
  });

// ---------------------------------------------------------------------------
// Postal code — exactly 5 numeric digits (Sri Lanka standard)
// ---------------------------------------------------------------------------

export const slPostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, {
    message: 'Your postal code must be exactly 5 numeric digits',
  });

// ---------------------------------------------------------------------------
// Full checkout form schema
// ---------------------------------------------------------------------------

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name (at least 2 characters)'),

  phone: slPhoneSchema,

  houseNo: z
    .string()
    .trim()
    .min(1, 'Please enter house number, apartment, or landmark for delivery')
    .max(50, 'House number/landmark is too long (max 50 characters)')
    .regex(
      /^[A-Za-z0-9\s/.,#-]+$/,
      'Only letters, numbers, and basic punctuation (/.,#-) allowed'
    ),

  streetAddress: z
    .string()
    .trim()
    .min(2, 'Please enter your street name')
    .max(120, 'Street name is too long (max 120 characters)'),

  province: z
    .string()
    .min(1, 'Please select a province'),

  district: z
    .string()
    .min(1, 'Please select a district'),

  city: z
    .string()
    .min(1, 'Please select a city'),

  postalCode: slPostalCodeSchema,

  paymentMethod: z.enum(['card', 'cod']),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// ---------------------------------------------------------------------------
// Individual field validators for onBlur use
// ---------------------------------------------------------------------------

export function validatePhone(value: string): string | undefined {
  const result = slPhoneSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validatePostalCode(value: string): string | undefined {
  const result = slPostalCodeSchema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

// validateField is intentionally removed — use validatePhone, validatePostalCode,
// validateStreetAddress directly for per-field onBlur validation.

// ---------------------------------------------------------------------------
// Format display address in Sri Lankan standard
// ---------------------------------------------------------------------------

export function formatSriLankanAddress(
  streetAddress: string,
  city: string
): string {
  return `${streetAddress}, ${city.toUpperCase()}, SRI LANKA`;
}

// ---------------------------------------------------------------------------
// Normalize phone for DB storage (always store as local 07X format)
// ---------------------------------------------------------------------------

export function normalizePhoneForStorage(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('+94')) {
    return '0' + cleaned.slice(3);
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// House Number & Street validators (standalone, for onBlur)
// ---------------------------------------------------------------------------

export function validateHouseNo(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < 1) return 'Please enter house number, apartment, or landmark for delivery';
  if (trimmed.length > 50) return 'House number/landmark is too long (max 50 characters)';
  if (!/^[A-Za-z0-9\s/.,#-]+$/.test(trimmed)) {
    return 'Only letters, numbers, and basic punctuation (/.,#-) allowed';
  }
  return undefined;
}

export function validateStreetAddress(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < 2) return 'Please enter your street name';
  if (trimmed.length > 120) return 'Street name is too long (max 120 characters)';
  return undefined;
}

// ---------------------------------------------------------------------------
// Backend re-validation — call this in API route before DB insert
// ---------------------------------------------------------------------------

export interface StructuredAddress {
  houseNo: string;
  streetAddress: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
}

export function sanitizeAndValidateAddress(addr: StructuredAddress): { ok: true } | { ok: false; error: string } {
  const houseErr = validateHouseNo(addr.houseNo);
  if (houseErr) return { ok: false, error: houseErr };
  
  const streetErr = validateStreetAddress(addr.streetAddress);
  if (streetErr) return { ok: false, error: streetErr };
  
  if (!addr.province?.trim()) return { ok: false, error: 'Province is required' };
  if (!addr.district?.trim()) return { ok: false, error: 'District is required' };
  if (!addr.city?.trim()) return { ok: false, error: 'City is required' };
  if (!/^\d{5}$/.test(addr.postalCode?.trim() ?? '')) return { ok: false, error: 'Your postal code must be exactly 5 numeric digits' };
  return { ok: true };
}
