-- ============================================================
-- DIAGNOSTIC: Run this first to see what's in your owners table
-- ============================================================
SELECT 
    o.id,
    o.email,
    o.role,
    u.email as auth_email
FROM owners o
LEFT JOIN auth.users u ON u.id = o.id;

-- ============================================================
-- FIX: Run this to sync your auth users to the owners table
-- with correct roles. This is safe to run multiple times.
-- ============================================================

-- Step 1: Upsert the admin user
INSERT INTO owners (id, email, full_name, role)
SELECT id, email, 'System Admin', 'admin'
FROM auth.users
WHERE email = 'admin@myshop.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email;

-- Step 2: Upsert shop owners (won't override admin if they accidentally exist)
INSERT INTO owners (id, email, full_name, role)
SELECT id, email, split_part(email, '@', 1), 'shop_owner'
FROM auth.users
WHERE email != 'admin@myshop.com'
ON CONFLICT (id) DO UPDATE SET role = 'shop_owner', email = EXCLUDED.email;

-- Step 3: Verify – should show correct roles after running above
SELECT id, email, role FROM owners ORDER BY role;
