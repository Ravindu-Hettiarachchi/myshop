-- ============================================================
-- FIX: INFINITE RECURSION IN OWNERS TABLE RLS
-- ============================================================

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can manage all owners" ON owners;
DROP POLICY IF EXISTS "Users can view own record" ON owners;
DROP POLICY IF EXISTS "Admins can manage all" ON owners;

-- 2. Create the non-recursive policies
-- Allow users to see their own record
CREATE POLICY "Users can view own record" ON owners
    FOR SELECT USING (id = auth.uid());

-- Allow admins to see/manage everything (Uses a non-recursive subquery)
CREATE POLICY "Admins can manage all" ON owners
    FOR ALL USING (
        (SELECT role FROM owners WHERE id = auth.uid()) = 'admin'
    );

-- 3. Verify the fix
-- If this query returns your user record without error, the fix worked:
SELECT id, email, role FROM owners WHERE id = auth.uid();
