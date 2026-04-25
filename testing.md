# MyShop — Testing Guide

## Prerequisites

1. Your dev server must be running: `npm run dev` inside the `myshop/` directory
2. Your Supabase project must be connected (`.env.local` filled in)
3. The database migration must be applied (see `database/schema.sql`)

---

## Step 1: Create Test Users in Supabase

Go to [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users** → **Add User**.

| Role | Email | Password |
|---|---|---|
| Platform Admin | `admin@myshop.com` | `Admin1234!` |
| Shop Owner | `nuwan@test.com` | `Test1234!` |

---

## Step 2: Link Users to the Database

Run this in the **Supabase SQL Editor** after creating both users:

```sql
-- Insert admin owner
INSERT INTO owners (id, email, full_name, role)
SELECT id, email, 'System Admin', 'admin'
FROM auth.users WHERE email = 'admin@myshop.com';

-- Insert shop owner
INSERT INTO owners (id, email, full_name, role)
SELECT id, email, 'Nuwan K.', 'shop_owner'
FROM auth.users WHERE email = 'nuwan@test.com';

-- Insert a test shop (starts as unapproved)
INSERT INTO shops (owner_id, shop_name, route_path, is_approved, template, primary_color, tagline)
SELECT id, 'Ceylon Spice House', 'ceylon-spices', false, 'minimal-white', '#D97706', 'Authentic flavors from the island'
FROM auth.users WHERE email = 'nuwan@test.com';
```

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | `admin@myshop.com` | `Admin1234!` |
| **Shop Owner** | `nuwan@test.com` | `Test1234!` |

---

## Test URLs

All URLs are on `http://localhost:3000`

| URL | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login with email or Google |
| `/signup` | Register a new shop owner |
| `/onboarding` | Business verification form |
| `/dashboard` | Shop owner dashboard overview |
| `/dashboard/settings` | Storefront customization panel |
| `/dashboard/manage/products` | Product inventory management |
| `/admin` | Platform admin — approve/reject shops |
| `/shop/ceylon-spices` | Test shop's public storefront |

---

## Full End-to-End Test Flow

```
1. Run SQL above to seed test data
2. Go to /login → sign in as nuwan@test.com (shop owner)
3. Visit /shop/ceylon-spices → should show "Coming Soon" (not approved)
4. Go to /dashboard/settings → change template & colors → Save Changes
5. Log out → sign in as admin@myshop.com
6. Go to /admin → approve "Ceylon Spice House"
7. Visit /shop/ceylon-spices → see the LIVE storefront with your customizations!
```

---

## RBAC Security Tests

| Test | Expected Result |
|---|---|
| Visit `/dashboard` while logged out | Redirected to `/login` ✅ |
| Visit `/admin` as shop owner | Redirected to `/login` ✅ |
| Visit `/shop/ceylon-spices` before approval | "Coming Soon" page ✅ |
| Visit `/shop/ceylon-spices` after approval | Full storefront renders ✅ |

---

## Tips

- Open two browser windows (one incognito) to test both roles simultaneously
- After changing settings, always click **Save Changes** before previewing the storefront
- The `/shop/[slug]` page is server-rendered — a hard refresh always shows the latest saved config

## Checkout & Geolocation Testing

### 1. Address Validation Tests
- Try leaving "House No / Apartment / Landmark" empty and blur → Red error appears.
- Try typing single letter "A" in House No → Allowed.
- Try entering "123" without letters in "Street Name" → Error (min 2 chars).

### 2. Map & Sync Tests
- Click "Use Current Location" (browser prompt appears).
- Map drops a pin exactly on coordinates.
- "Location synced successfully" ✅ message appears.
- Province, District, and City are automatically populated (matching Nominatim to Sri Lanka DB).
- Postal code is filled (exactly 5 digits).

### 3. Edge Cases
- Drop pin in ocean → "Unable to detect location details. Please select manually."
- Drop pin in deep village without city name mapping → District & Province filled, City remains blank, Sync banner says "Unable to detect: City ... Please select manually."
- Checkout Button logic → Remains disabled until ALL fields (including house number, synced location, valid phone) are populated.


### 4. Location Search Tests
- Open map modal and type "Temple" or "Cargills" in the search bar.
- Wait 500ms for debounced search to trigger.
- Click a suggestion from the dropdown.
- Verify map pin moves automatically to the searched location.
- Verify "📍 Selected: [Place Name]" appears.
- Confirm that the address fields (Province, District, City, etc.) sync correctly after selection.

