import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Shipping Cost API
 * Simulates PickMe Flash / Grasshoppers API integration
 * In production: replace with real carrier API calls
 */

// Shipping zone configuration (by district)
const SHIPPING_ZONES: Record<string, { fee: number; days: string; label: string }> = {
  // Western Province — fastest
  'Colombo':    { fee: 250,  days: '1–2',   label: 'Same / Next Day' },
  'Gampaha':    { fee: 280,  days: '1–2',   label: 'Same / Next Day' },
  'Kalutara':   { fee: 320,  days: '1–3',   label: 'Next Day' },

  // Central Province
  'Kandy':      { fee: 380,  days: '2–3',   label: '2–3 Business Days' },
  'Matale':     { fee: 400,  days: '2–4',   label: '2–4 Business Days' },
  'Nuwara Eliya': { fee: 450, days: '3–4',  label: '3–4 Business Days' },

  // Southern Province
  'Galle':      { fee: 350,  days: '2–3',   label: '2–3 Business Days' },
  'Matara':     { fee: 380,  days: '2–3',   label: '2–3 Business Days' },
  'Hambantota': { fee: 420,  days: '3–4',   label: '3–4 Business Days' },

  // Northern Province
  'Jaffna':       { fee: 550, days: '4–5',  label: '4–5 Business Days' },
  'Kilinochchi':  { fee: 600, days: '5–6',  label: '5–6 Business Days' },
  'Mannar':       { fee: 600, days: '5–6',  label: '5–6 Business Days' },
  'Vavuniya':     { fee: 580, days: '4–6',  label: '4–6 Business Days' },
  'Mullaitivu':   { fee: 620, days: '5–7',  label: '5–7 Business Days' },

  // Eastern Province
  'Trincomalee':  { fee: 500, days: '3–5',  label: '3–5 Business Days' },
  'Batticaloa':   { fee: 520, days: '4–5',  label: '4–5 Business Days' },
  'Ampara':       { fee: 520, days: '4–5',  label: '4–5 Business Days' },

  // North Western Province
  'Kurunegala':   { fee: 380, days: '2–3',  label: '2–3 Business Days' },
  'Puttalam':     { fee: 420, days: '2–4',  label: '2–4 Business Days' },

  // North Central Province
  'Anuradhapura': { fee: 450, days: '3–4',  label: '3–4 Business Days' },
  'Polonnaruwa':  { fee: 470, days: '3–4',  label: '3–4 Business Days' },

  // Uva Province
  'Badulla':      { fee: 480, days: '3–5',  label: '3–5 Business Days' },
  'Moneragala':   { fee: 500, days: '4–5',  label: '4–5 Business Days' },

  // Sabaragamuwa Province
  'Ratnapura':    { fee: 420, days: '2–4',  label: '2–4 Business Days' },
  'Kegalle':      { fee: 380, days: '2–3',  label: '2–3 Business Days' },
};

const DEFAULT_SHIPPING = { fee: 450, days: '3–5', label: '3–5 Business Days' };

export interface ShippingQuote {
  fee: number;
  estimatedDays: string;
  label: string;
  carrier: string;
  district: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district');
  const city = searchParams.get('city');

  if (!district) {
    return NextResponse.json(
      { error: 'District parameter is required' },
      { status: 400 }
    );
  }

  // Simulate 200–400ms carrier API latency
  await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250));

  const zone = SHIPPING_ZONES[district] ?? DEFAULT_SHIPPING;

  // Small city-level adjustments (simulate granularity)
  let adjustedFee = zone.fee;
  if (city && ['Colombo 01', 'Colombo 02', 'Colombo 03'].includes(city)) {
    adjustedFee = Math.max(200, zone.fee - 50); // CBD discount
  }

  const quote: ShippingQuote = {
    fee: adjustedFee,
    estimatedDays: zone.days,
    label: zone.label,
    carrier: 'PickMe Flash',
    district,
  };

  return NextResponse.json(quote);
}
