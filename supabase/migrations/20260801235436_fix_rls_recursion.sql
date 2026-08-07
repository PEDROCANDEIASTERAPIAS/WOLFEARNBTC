/*
# Fix infinite recursion in RLS policies

## Problem
Multiple RLS policies on profiles, ads, campaigns, and withdrawals use
`EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)`
to check admin status. When a policy on the `profiles` table itself queries
`profiles` in its predicate, Postgres detects infinite recursion and throws
`42P17: infinite recursion detected in policy for relation "profiles"`.

## Fix
1. Create a `SECURITY DEFINER` function `is_admin()` that reads the profiles
   table with elevated privileges (bypassing RLS). This breaks the recursion
   because the function runs as the owner, not under the calling role's RLS.
2. Replace all `EXISTS (SELECT 1 FROM profiles ...)` subqueries in policies
   with a simple `public.is_admin()` call.
3. Drop and recreate every affected policy.

## Affected tables & policies
- profiles: profiles_select_own_or_admin
- ads: ads_select_authenticated, ads_insert_admin, ads_update_admin, ads_delete_admin
- ad_views: ad_views_select_own_or_admin
- campaigns: campaigns_select_own_or_admin, campaigns_update_own_or_admin
- withdrawals: withdrawals_select_own_or_admin, withdrawals_update_own_or_admin
*/

-- =========================================================
-- is_admin() helper — breaks the recursion
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =========================================================
-- PROFILES — fix select policy
-- =========================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR public.is_admin()
);

-- =========================================================
-- ADS — fix all policies
-- =========================================================
DROP POLICY IF EXISTS "ads_select_authenticated" ON ads;
CREATE POLICY "ads_select_authenticated"
ON ads FOR SELECT
TO authenticated
USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "ads_insert_admin" ON ads;
CREATE POLICY "ads_insert_admin"
ON ads FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ads_update_admin" ON ads;
CREATE POLICY "ads_update_admin"
ON ads FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "ads_delete_admin" ON ads;
CREATE POLICY "ads_delete_admin"
ON ads FOR DELETE
TO authenticated
USING (public.is_admin());

-- =========================================================
-- AD_VIEWS — fix select policy
-- =========================================================
DROP POLICY IF EXISTS "ad_views_select_own_or_admin" ON ad_views;
CREATE POLICY "ad_views_select_own_or_admin"
ON ad_views FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- =========================================================
-- CAMPAIGNS — fix policies
-- =========================================================
DROP POLICY IF EXISTS "campaigns_select_own_or_admin" ON campaigns;
CREATE POLICY "campaigns_select_own_or_admin"
ON campaigns FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "campaigns_update_own_or_admin" ON campaigns;
CREATE POLICY "campaigns_update_own_or_admin"
ON campaigns FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- =========================================================
-- WITHDRAWALS — fix policies
-- =========================================================
DROP POLICY IF EXISTS "withdrawals_select_own_or_admin" ON withdrawals;
CREATE POLICY "withdrawals_select_own_or_admin"
ON withdrawals FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "withdrawals_update_own_or_admin" ON withdrawals;
CREATE POLICY "withdrawals_update_own_or_admin"
ON withdrawals FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());
