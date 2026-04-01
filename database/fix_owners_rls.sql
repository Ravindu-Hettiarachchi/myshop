-- Fix: Replace the self-referencing owners RLS policy with a SECURITY DEFINER function
-- The old policy caused infinite recursion because it queried 'owners' table from within an owners policy.

-- Step 1: Drop the broken policy
DROP POLICY IF EXISTS "Admins can manage all owners" ON owners;
DROP POLICY IF EXISTS "Users can view own record" ON owners;

-- Step 2: Create a SECURITY DEFINER function that checks admin role WITHOUT triggering RLS
-- This function runs as the table owner (bypasses RLS) so it won't recurse.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM owners
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 3: Re-create the admin policy using the safe function
CREATE POLICY "Admins can manage all owners"
  ON owners
  FOR ALL
  USING (is_admin());

-- Step 4: Re-create the self-view policy
CREATE POLICY "Users can view own record"
  ON owners
  FOR SELECT
  USING (id = auth.uid());
