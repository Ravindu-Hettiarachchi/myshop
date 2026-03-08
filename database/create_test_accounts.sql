-- Run this script in your Supabase SQL Editor to permanently add test accounts
-- It creates the users in both `auth.users` (so they can log in) and `public.owners` (for roles)

DO $$
DECLARE
  admin_uid    UUID := 'a0000000-0000-0000-0000-000000000001';
  owner_uid    UUID := 'a0000000-0000-0000-0000-000000000002';
  customer_uid UUID := 'a0000000-0000-0000-0000-000000000003';
BEGIN
  -- Cleanup any existing accounts with the target emails to prevent unique constraint errors
  DELETE FROM auth.users WHERE email IN ('admin@myshop.com', 'owner@myshop.com', 'customer@myshop.com');
  DELETE FROM public.owners WHERE email IN ('admin@myshop.com', 'owner@myshop.com', 'customer@myshop.com');

  ---------------------------------------------------------
  -- 1. Create System Admin
  ---------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@myshop.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_uid, admin_uid::text, format('{"sub":"%s","email":"%s"}', admin_uid::text, 'admin@myshop.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  ---------------------------------------------------------
  -- 2. Create Shop Owner
  ---------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    owner_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@myshop.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), owner_uid, owner_uid::text, format('{"sub":"%s","email":"%s"}', owner_uid::text, 'owner@myshop.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  ---------------------------------------------------------
  -- 3. Create Customer
  ---------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    customer_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer@myshop.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), customer_uid, customer_uid::text, format('{"sub":"%s","email":"%s"}', customer_uid::text, 'customer@myshop.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT DO NOTHING;


  ---------------------------------------------------------
  -- 4. Assign Roles in public.owners table
  ---------------------------------------------------------
  INSERT INTO public.owners (id, email, full_name, role) VALUES 
    (admin_uid, 'admin@myshop.com', 'System Admin', 'admin'),
    (owner_uid, 'owner@myshop.com', 'Test Shop Owner', 'shop_owner'),
    (customer_uid, 'customer@myshop.com', 'Test Customer', 'customer')
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

END $$;
