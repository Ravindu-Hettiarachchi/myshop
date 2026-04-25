'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';
import { createCustomerClient } from '@/utils/supabase/customer-client';
import {
  Loader2, ArrowLeft, CreditCard, Wallet, MapPin, Truck,
  AlertCircle, Navigation, Map, CheckCircle, Package,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { formatPriceWithUnit, formatQuantityLabel, type ProductUnit } from '@/lib/products';
import {
  SRI_LANKA_LOCATIONS, getDistrictsForProvince, getCitiesForDistrict, getPostalCodeForCity,
  matchLocationFromGeocode,
} from '@/lib/srilanka-locations';
import {
  validatePhone, validatePostalCode, validateStreetAddress, normalizePhoneForStorage,
} from '@/lib/checkout-validation';

// Dynamically import Leaflet map (no SSR)
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => (
  <div className="w-full h-96 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
    <Map className="w-8 h-8" />
  </div>
) });
import LocationSearch from './LocationSearch';
import { v4 as uuidv4 } from 'uuid';

/* ───────── Types ───────── */
interface CartItem {
  id: string; title: string; price: number; image?: string;
  quantityMultiplier: number; orderedQuantity: number; orderedUnit: ProductUnit;
  selling_unit_value: number; selling_unit: ProductUnit;
  stock_quantity: number; stock_unit: ProductUnit;
}
interface ShopData {
  id: string; route_path: string; tax_rate: number | string | null; template: string | null;
}
type Field = 'fullName' | 'phone' | 'houseNo' | 'streetAddress' | 'province' | 'district' | 'city' | 'postalCode' | 'cardNumber' | 'cardHolder' | 'cardExpiry' | 'cardCvv';
type Errors = Partial<Record<Field, string>>;
type Touched = Partial<Record<Field, boolean>>;

/* ───────── Tiny helpers ───────── */
function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}

function inputCls(field: Field, touched: Touched, errors: Errors, isDark: boolean) {
  const invalid = touched[field] && errors[field];
  if (invalid) return 'w-full px-4 py-3 rounded-xl border border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300 bg-white text-gray-900';
  return isDark
    ? 'w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-950 text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white'
    : 'w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black hover:border-gray-400';
}

function selectCls(field: Field, touched: Touched, errors: Errors, isDark: boolean) {
  return inputCls(field, touched, errors, isDark) + ' appearance-none cursor-pointer';
}

/* ───────── Nominatim reverse geocode ───────── */
interface GeocodeResult {
  street: string;
  city: string;
  postal: string;
  state: string;   // maps to province
  county: string;  // maps to district
  raw: string;
}
async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json() as {
      display_name?: string;
      address?: {
        road?: string; house_number?: string; suburb?: string;
        city?: string; town?: string; village?: string;
        postcode?: string; state?: string; county?: string;
        state_district?: string;
      };
    };
    const a = data.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ') || a.suburb || '';
    const city   = a.city || a.town || a.village || a.suburb || '';
    const state  = a.state ?? '';
    // Nominatim uses county OR state_district for Sri Lanka districts
    const county = a.county || a.state_district || '';
    const postal = (a.postcode ?? '').replace(/\D/g, '').slice(0, 5);
    return { street, city, state, county, postal, raw: data.display_name ?? '' };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function CheckoutClient({ shop }: { shop: ShopData }) {
  const router = useRouter();
  const supabaseRef = useRef(createCustomerClient());
  const supabase = supabaseRef.current;

  /* ── Cart & session ── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  /* ── Form fields ── */
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');

  /* ── Card fields ── */
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setTouched(t => ({ ...t, cardNumber: true }));
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
    setTouched(t => ({ ...t, cardExpiry: true }));
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 3));
    setTouched(t => ({ ...t, cardCvv: true }));
  };

  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardHolder(e.target.value);
    setTouched(t => ({ ...t, cardHolder: true }));
  };

  /* ── Map ── */
  const [lat, setLat] = useState(6.9271);
  const [lng, setLng] = useState(79.8612);
  const [locationSelected, setLocationSelected] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'partial' | 'failed'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedPlaceName, setSelectedPlaceName] = useState('');

  /* ── Shipping ── */
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingLabel, setShippingLabel] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);

  /* ── Validation ── */
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({});
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  /* ── Derived ── */
  const isDark = shop.template === 'modern-dark';
  const districts = province ? getDistrictsForProvince(province) : [];
  const cities = province && district ? getCitiesForDistrict(province, district) : [];
  const rawTax = typeof shop.tax_rate === 'number' ? shop.tax_rate : parseFloat(shop.tax_rate ?? '0');
  const taxRate = Number.isFinite(rawTax) ? rawTax : 0;
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantityMultiplier, 0);
  const taxAmt = cartTotal * (taxRate / 100);
  const shippingAmt = shippingFee ?? 0;
  const grandTotal = cartTotal + taxAmt + shippingAmt;

  /* ── Init effect ── */
  useEffect(() => {
    const saved = localStorage.getItem(`myshop_cart_${shop.id}`);
    if (saved) { try { setCart(JSON.parse(saved)); } catch { /* */ } }
    const draft = localStorage.getItem(`myshop_checkout_draft_${shop.id}`);
    if (draft) {
      try {
        const d = JSON.parse(draft) as Partial<{
          fullName: string; phone: string; houseNo: string; streetAddress: string;
          province: string; district: string; city: string;
          postalCode: string; paymentMethod: 'card' | 'cod';
        }>;
        if (d.fullName) setFullName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.houseNo) setHouseNo(d.houseNo);
        if (d.streetAddress) setStreetAddress(d.streetAddress);
        if (d.province) setProvince(d.province);
        if (d.district) setDistrict(d.district);
        if (d.city) setCity(d.city);
        if (d.postalCode) setPostalCode(d.postalCode);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
      } catch { /* */ }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setSessionUser(session.user); setCustomerEmail(session.user.email ?? ''); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id]);

  /* ── Draft save ── */
  useEffect(() => {
    localStorage.setItem(`myshop_checkout_draft_${shop.id}`, JSON.stringify({
      fullName, phone, houseNo, streetAddress, province, district, city, postalCode, paymentMethod,
    }));
  }, [shop.id, fullName, phone, houseNo, streetAddress, province, district, city, postalCode, paymentMethod]);

  /* ── Shipping fetch when district changes ── */
  useEffect(() => {
    if (!district) { setShippingFee(null); setShippingLabel(''); return; }
    setShippingLoading(true);
    fetch(`/api/shipping/quote?district=${encodeURIComponent(district)}&city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then((d: { fee?: number; label?: string }) => {
        setShippingFee(d.fee ?? null);
        setShippingLabel(d.label ?? '');
      })
      .catch(() => { /* silently skip */ })
      .finally(() => setShippingLoading(false));
  }, [district, city]);

  /* ── Validation ── */
  const validate = useCallback((): Errors => {
    const e: Errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'Full name is required (min 2 characters)';
    const phoneErr = validatePhone(phone);
    if (phoneErr) e.phone = phoneErr;
    if (!houseNo.trim()) e.houseNo = 'Please enter house number, apartment, or landmark for delivery';
    const addrErr = validateStreetAddress(streetAddress);
    if (addrErr) e.streetAddress = addrErr;
    if (!province) e.province = 'Please select your Province';
    if (!district) e.district = 'Please select your District';
    if (!city) e.city = 'Please select your City';
    const postalErr = validatePostalCode(postalCode);
    if (postalErr) e.postalCode = postalErr;

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length !== 16) e.cardNumber = 'Card number must be 16 digits';
      if (!cardHolder.trim()) e.cardHolder = 'Card holder name is required';
      
      const expClean = cardExpiry.replace(/[^\d/]/g, '');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expClean)) {
        e.cardExpiry = 'Invalid expiry date';
      } else {
        const [mm, yy] = expClean.split('/');
        const exp = new Date(2000 + parseInt(yy, 10), parseInt(mm, 10) - 1);
        const now = new Date();
        now.setDate(1); now.setHours(0,0,0,0);
        if (exp < now) e.cardExpiry = 'Card has expired';
      }
      
      const cleanCvv = cardCvv.replace(/\D/g, '');
      if (cleanCvv.length !== 3) e.cardCvv = 'CVV must be 3 digits';
    }

    return e;
  }, [fullName, phone, houseNo, streetAddress, province, district, city, postalCode, paymentMethod, cardNumber, cardHolder, cardExpiry, cardCvv]);

  const isFormValid = Object.keys(validate()).length === 0 && locationSelected;

  useEffect(() => {
    setErrors(validate());
  }, [validate]);

  const blur = (field: Field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  /* ── Location select from map — full cascade sync ── */
  const handleLocationSelect = useCallback(async (la: number, lo: number, displayName?: string) => {
    setLat(la); setLng(lo); setLocationSelected(true);
    setGeocoding(true); setGeoError(''); setSyncStatus('idle'); setSyncMessage('');
    if (displayName) setSelectedPlaceName(displayName); else setSelectedPlaceName('');

    const result = await reverseGeocode(la, lo);
    setGeocoding(false);

    if (!result) {
      setGeoError('Could not auto-fill address. Please fill in manually.');
      setSyncStatus('failed');
      return;
    }

    // Auto-fill street address
    if (result.street) setStreetAddress(result.street);

    // ── Fuzzy-match API response → internal dataset ──────────────────────────
    const match = matchLocationFromGeocode(
      result.state,
      result.county,
      result.city,
      result.postal,
    );

    // Apply matched province (triggers district list to populate)
    if (match.province) {
      setProvince(match.province);
    } else {
      setProvince('');
    }

    // Apply matched district (triggers city list to populate)
    if (match.district) {
      setDistrict(match.district);
    } else {
      setDistrict('');
    }

    // Apply matched city
    if (match.city) {
      setCity(match.city);
    } else if (result.city) {
      // city not in dataset — keep raw value so user sees it
      setCity(result.city);
    }

    // Apply postal code (dataset fallback already applied inside matcher)
    if (match.postalCode) setPostalCode(match.postalCode);

    // ── Sync status feedback ─────────────────────────────────────────────────
    if (!match.partial && match.province && match.district && match.city) {
      setSyncStatus('synced');
      setSyncMessage('✔ Location synced successfully');
    } else if (match.province || match.district) {
      setSyncStatus('partial');
      const hint = match.unmatched.length > 0
        ? `Unable to detect: ${match.unmatched.join(', ')}. Please select manually.`
        : 'Unable to detect location details. Please select manually.';
      setSyncMessage(hint);
      setGeoError(hint);
    } else {
      setSyncStatus('failed');
      setGeoError('Unable to detect location details. Please select Province, District, and City manually.');
    }

    // Clear sync message after 4 seconds
    setTimeout(() => setSyncMessage(''), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Use current location ── */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported by your browser.'); return; }
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
        setShowMap(true);
      },
      () => setGeoError('Please allow location access or select manually on map'),
      { timeout: 10000 }
    );
  };

  /* ── Place order ── */
  const handlePlaceOrder = async () => {
    const touchAll: Touched = { fullName: true, phone: true, houseNo: true, streetAddress: true, province: true, district: true, city: true, postalCode: true };
    if (paymentMethod === 'card') {
      touchAll.cardNumber = true;
      touchAll.cardHolder = true;
      touchAll.cardExpiry = true;
      touchAll.cardCvv = true;
    }
    setTouched(touchAll);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      setOrderError(firstError || 'Address incomplete');
      return;
    }
    if (cart.length === 0) return;
    if (!locationSelected) { setOrderError('Location details not selected'); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push(`/shop/${shop.route_path}/login?next=${encodeURIComponent(`/shop/${shop.route_path}/checkout`)}`);
      return;
    }
    if (!sessionUser) { setSessionUser(session.user); setCustomerEmail(session.user.email ?? ''); }

    setIsCheckingOut(true); setOrderError('');
    try {
      const payload = {
        id: uuidv4(), // order.id
        shopId: shop.id, routePath: shop.route_path, paymentMethod,
        customer: {
          id: uuidv4(), // customer.id
          email: customerEmail,
          fullName: fullName.trim(),
          phone: normalizePhoneForStorage(phone),
          houseNumber: houseNo.trim(),
          street: streetAddress.trim(),
          city: city.toUpperCase(),
          district, province,
          postalCode: postalCode.trim(),
          latitude: lat, longitude: lng,
        },
        items: cart.map(item => ({
          ...item,
          cartItemId: uuidv4() // cartItem.id
        })),
      };
      console.log("FINAL ORDER PAYLOAD:", payload);

      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { error?: string; orderId?: string };
      if (!res.ok || !json.orderId) throw new Error(json.error ?? 'Failed to place order.');
      localStorage.removeItem(`myshop_cart_${shop.id}`);
      localStorage.removeItem(`myshop_checkout_draft_${shop.id}`);
      setOrderSuccess('Order placed successfully! Redirecting…');
      setTimeout(() => router.push(`/shop/${shop.route_path}/checkout/success?orderId=${json.orderId}`), 900);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };


  /* ── Empty cart guard ── */
  if (cart.length === 0) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
      <button onClick={() => router.push(`/shop/${shop.route_path}`)} className="text-blue-600 hover:underline">Continue Shopping</button>
    </div>
  );

  const card = isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const btn   = isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800';
  const lbl   = `block text-sm font-semibold mb-1.5 ${muted}`;

  return (
    <div className={`min-h-screen py-10 ${isDark ? 'bg-gray-950' : 'bg-gray-50/50'}`}>
      {showMap && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2 font-bold text-gray-900"><Map className="w-5 h-5 text-blue-600" /> Select Delivery Location</div>
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <LocationSearch onSelect={handleLocationSelect} />
              </div>
              {selectedPlaceName && (
                <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Selected:</span> {selectedPlaceName}
                </div>
              )}
              {geocoding && <div className="mb-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-xl px-4 py-2"><Loader2 className="w-4 h-4 animate-spin" /> Auto-filling address…</div>}
              {geoError  && <div className="mb-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-2"><AlertCircle className="w-4 h-4" /> {geoError}</div>}
              <MapPicker defaultLat={lat} defaultLng={lng} onLocationSelect={handleLocationSelect} />
              <p className="text-xs text-gray-400 mt-2 text-center">Click map or drag the pin to your exact delivery spot</p>
            </div>
            <div className="px-6 pb-5">
              <button 
                onClick={() => setShowMap(false)} 
                disabled={!locationSelected}
                className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${locationSelected ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <CheckCircle className="w-4 h-4" /> Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm font-medium hover:opacity-70 mb-10 transition-opacity ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <ArrowLeft className="w-4 h-4" /> Return to Cart
        </button>
        {orderError   && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{orderError}</span></div>}
        {orderSuccess && <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 flex items-center gap-3 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /><span>{orderSuccess}</span></div>}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <div className={`p-8 rounded-3xl border shadow-sm ${card}`}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="w-5 h-5" /> Contact & Delivery</h2>
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Full Name *</label>
                  <input value={fullName} onChange={e => { setFullName(e.target.value); if (touched.fullName) setErrors(validate()); }}
                    onBlur={() => blur('fullName')} placeholder="Kamal Perera" className={inputCls('fullName', touched, errors, isDark)} />
                  <Err msg={touched.fullName ? errors.fullName : undefined} />
                </div>
                <div>
                  <label className={lbl}>Mobile Number * <span className="font-normal text-xs opacity-70">(070–078 format)</span></label>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone} 
                    onChange={e => { 
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPhone(cleaned); 
                      if (touched.phone) setErrors(validate()); 
                    }}
                    onBlur={() => blur('phone')} 
                    placeholder="0771234567" 
                    className={inputCls('phone', touched, errors, isDark)} 
                  />
                  <Err msg={touched.phone ? errors.phone : undefined} />
                </div>
                <div>
                  <label className={lbl}>Delivery Location *</label>
                  <div className="flex gap-3 flex-wrap">
                    <button type="button" onClick={handleUseMyLocation}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition">
                      <Navigation className="w-4 h-4" /> Use Current Location
                    </button>
                    <button type="button" onClick={() => setShowMap(true)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${locationSelected ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <Map className="w-4 h-4" /> {locationSelected ? 'Change Location' : 'Select on Map'}
                    </button>
                  </div>
                  {geoError && !showMap && <p className="flex items-center gap-1 text-xs text-amber-600 mt-2"><AlertCircle className="w-3 h-3" /> {geoError}</p>}
                  {locationSelected && <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Location pinned · {lat.toFixed(5)}, {lng.toFixed(5)}</p>}
                  {syncMessage && (
                    <p className={`flex items-center gap-1.5 text-xs mt-1.5 font-medium ${syncStatus === 'synced' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {syncStatus === 'synced' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} {syncMessage}
                    </p>
                  )}
                </div>
                <div>
                  <label className={lbl}>House No / Apartment / Landmark *</label>
                  <input value={houseNo} onChange={e => { setHouseNo(e.target.value); if (touched.houseNo) setErrors(validate()); }}
                    onBlur={() => blur('houseNo')} placeholder="e.g., 45/2, Flat 3B, Near Temple" className={inputCls('houseNo', touched, errors, isDark)} />
                  <Err msg={touched.houseNo ? errors.houseNo : undefined} />
                </div>
                <div>
                  <label className={lbl}>Street Name *</label>
                  <input value={streetAddress} onChange={e => { setStreetAddress(e.target.value); if (touched.streetAddress) setErrors(validate()); }}
                    onBlur={() => blur('streetAddress')} placeholder="Galle Road" className={inputCls('streetAddress', touched, errors, isDark)} />
                  <Err msg={touched.streetAddress ? errors.streetAddress : undefined} />
                </div>
                <div>
                  <label className={lbl}>Province *</label>
                  <select value={province} onBlur={() => blur('province')}
                    onChange={e => { setProvince(e.target.value); setDistrict(''); setCity(''); setPostalCode(''); if (touched.province) setErrors(validate()); }}
                    className={selectCls('province', touched, errors, isDark)}>
                    <option value="">— Select Province —</option>
                    {SRI_LANKA_LOCATIONS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                  <Err msg={touched.province ? errors.province : undefined} />
                </div>
                <div>
                  <label className={lbl}>District *</label>
                  <select value={district} disabled={!province} onBlur={() => blur('district')}
                    onChange={e => { setDistrict(e.target.value); setCity(''); setPostalCode(''); if (touched.district) setErrors(validate()); }}
                    className={selectCls('district', touched, errors, isDark) + (!province ? ' opacity-50 cursor-not-allowed' : '')}>
                    <option value="">— Select District —</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Err msg={touched.district ? errors.district : undefined} />
                </div>
                <div>
                  <label className={lbl}>City *</label>
                  <select value={city} disabled={!district} onBlur={() => blur('city')}
                    onChange={e => { const c = e.target.value; setCity(c); const pc = getPostalCodeForCity(province, district, c); if (pc) setPostalCode(pc); if (touched.city) setErrors(validate()); }}
                    className={selectCls('city', touched, errors, isDark) + (!district ? ' opacity-50 cursor-not-allowed' : '')}>
                    <option value="">— Select City —</option>
                    {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <Err msg={touched.city ? errors.city : undefined} />
                </div>
                <div>
                  <label className={lbl}>Postal Code * <span className="font-normal text-xs opacity-70">(5 digits, auto-filled)</span></label>
                  <input value={postalCode} onChange={e => { setPostalCode(e.target.value.replace(/\D/g,'').slice(0,5)); if (touched.postalCode) setErrors(validate()); }}
                    onBlur={() => blur('postalCode')} placeholder="00100" maxLength={5} className={inputCls('postalCode', touched, errors, isDark)} />
                  <Err msg={touched.postalCode ? errors.postalCode : undefined} />
                </div>
                {houseNo.trim().length >= 1 && streetAddress.trim().length >= 2 && city && (
                  <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">📍 Delivery Address Preview</p>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-line">
                      {houseNo.trim()}{'\n'}{streetAddress.trim()}{'\n'}<strong>{city.toUpperCase()}</strong>{district ? `, ${district}` : ''}{'\n'}SRI LANKA{postalCode ? ` - ${postalCode}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className={`p-8 rounded-3xl border shadow-sm ${card}`}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet className="w-5 h-5" /> Payment</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['card', 'cod'] as const).map(m => (
                  <label key={m} className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col items-center gap-3 transition-all ${paymentMethod === m ? (isDark ? 'border-white bg-white/5' : 'border-black bg-gray-50') : 'border-transparent bg-gray-100 opacity-60 hover:opacity-100'}`}>
                    <input type="radio" className="sr-only" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                    {m === 'card' ? <CreditCard className="w-7 h-7" /> : <Truck className="w-7 h-7" />}
                    <span className="font-bold text-sm">{m === 'card' ? 'Credit Card' : 'Cash on Delivery'}</span>
                    <span className={`text-xs ${muted}`}>{m === 'card' ? 'Demo / mock flow' : 'Pay when it arrives'}</span>
                  </label>
                ))}
              </div>
              {paymentMethod === 'card' && (
                <div className={`mt-5 p-5 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'} space-y-4 animate-in slide-in-from-top-2`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Card Details</span>
                    <div className="flex gap-1">
                      <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold italic">VISA</div>
                      <div className="w-8 h-5 bg-orange-500 rounded flex items-center justify-center text-[10px] text-white font-bold">MC</div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${muted}`}>Card Number</label>
                    <input type="tel" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={handleCardNumberChange} onBlur={() => blur('cardNumber')} className={inputCls('cardNumber', touched, errors, isDark)} />
                    <Err msg={touched.cardNumber ? errors.cardNumber : undefined} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${muted}`}>Cardholder Name</label>
                    <input type="text" maxLength={50} placeholder="John Doe" value={cardHolder} onChange={handleCardHolderChange} onBlur={() => blur('cardHolder')} className={inputCls('cardHolder', touched, errors, isDark)} />
                    <Err msg={touched.cardHolder ? errors.cardHolder : undefined} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${muted}`}>Expiry Date</label>
                      <input type="tel" inputMode="numeric" maxLength={5} placeholder="MM/YY" value={cardExpiry} onChange={handleCardExpiryChange} onBlur={() => blur('cardExpiry')} className={inputCls('cardExpiry', touched, errors, isDark)} />
                      <Err msg={touched.cardExpiry ? errors.cardExpiry : undefined} />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${muted}`}>CVV</label>
                      <input type="password" inputMode="numeric" maxLength={3} placeholder="•••" value={cardCvv} onChange={handleCardCvvChange} onBlur={() => blur('cardCvv')} className={inputCls('cardCvv', touched, errors, isDark)} />
                      <Err msg={touched.cardCvv ? errors.cardCvv : undefined} />
                    </div>
                  </div>
                  <div className="mt-2 p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 text-xs flex items-start gap-2">
                    <CreditCard className="w-4 h-4 shrink-0" /><span><strong>Secure Payment:</strong> This is a mock mode. Card details are validated securely but not stored.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className={`p-8 rounded-3xl border shadow-sm sticky top-8 ${card}`}>
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={item.image ?? 'https://images.unsplash.com/photo-1608688461751-692348db49b5?w=200&q=70'} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{formatPriceWithUnit(item.price, item.selling_unit, item.selling_unit_value)}</p>
                      <p className={`text-xs ${muted}`}>Qty x{item.quantityMultiplier} ({formatQuantityLabel(item.orderedQuantity, item.orderedUnit)})</p>
                    </div>
                    <p className="font-bold text-sm shrink-0">Rs. {(item.price * item.quantityMultiplier).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200/60 pt-5 space-y-3 text-sm">
                <div className={`flex justify-between ${muted}`}><span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span><span>Rs. {cartTotal.toLocaleString()}</span></div>
                {taxRate > 0 && <div className={`flex justify-between ${muted}`}><span>Tax ({taxRate}%)</span><span>Rs. {taxAmt.toFixed(2)}</span></div>}
                <div className={`flex justify-between ${muted}`}>
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery{shippingLabel ? ` · ${shippingLabel}` : ''}</span>
                  {shippingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{shippingFee != null ? `Rs. ${shippingFee.toLocaleString()}` : district ? '—' : 'Select district'}</span>}
                </div>
                <div className="flex justify-between text-2xl font-black pt-4 border-t border-gray-200/60">
                  <span>Total</span><span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              {!locationSelected && <p className="mt-4 text-xs text-center text-amber-600 flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5" /> Pin your delivery location on the map first</p>}
              <button id="place-order-btn" onClick={handlePlaceOrder} disabled={isCheckingOut || !isFormValid}
                className={`w-full py-4 mt-5 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${(isCheckingOut || !isFormValid) ? 'opacity-50 cursor-not-allowed' : ''} ${btn}`}>
                {isCheckingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order…</> : '🛒 Place Order'}
              </button>
              <p className="text-xs text-center mt-3 text-gray-400">* Required · Map pin required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
