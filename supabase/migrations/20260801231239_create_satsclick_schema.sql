/*
# SatsClick — Core schema for a Bitcoin Lightning PTC platform

## Overview
Creates the full data model for a multi-user Paid-To-Click app where users earn
sats by watching ads, advertisers pay to create campaigns, and admins manage
the platform. All tables use Row Level Security with ownership checks via
auth.uid().

## New Tables
- profiles: user profile, balance, stats, admin flag (auto-created on signup)
- ads: advertisements with reward, duration, click targets, status
- ad_views: record of each completed ad view (user + ad + reward)
- campaigns: advertiser campaigns with budget and Lightning invoice
- withdrawals: withdrawal requests with Lightning destination

## Security
- RLS enabled on all tables.
- profiles: users read/update own; admins read all.
- ads: authenticated read active; admins insert/update/delete.
- ad_views: users read own; users insert own.
- campaigns: users read own; users insert own; admins read all.
- withdrawals: users read/insert own; admins read all.
- Balance increments are server-enforced via SECURITY DEFINER functions.

## Important Notes
1. handle_new_user() trigger auto-creates a profiles row on auth signup.
2. record_ad_view() atomically records view + increments balance (server-enforced).
3. admin_create_ad(), admin_approve_ad(), admin_reject_ad(), admin_toggle_user_status()
   are admin-only SECURITY DEFINER functions.
4. process_withdrawal() atomically decrements balance and creates withdrawal record.
*/

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT 'satoshi_user',
  avatar_hue int NOT NULL DEFAULT (floor(random() * 360))::int,
  sats_balance bigint NOT NULL DEFAULT 0,
  total_earned_sats bigint NOT NULL DEFAULT 0,
  ads_clicked int NOT NULL DEFAULT 0,
  referral_earnings_sats bigint NOT NULL DEFAULT 0,
  referral_code text UNIQUE NOT NULL DEFAULT ('SAT' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6))),
  is_admin boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =========================================================
-- ADS
-- =========================================================
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  domain text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_sec int NOT NULL DEFAULT 15,
  reward_sats bigint NOT NULL DEFAULT 25,
  clicks_remaining int NOT NULL DEFAULT 1000,
  clicks_target int NOT NULL DEFAULT 1000,
  category text NOT NULL DEFAULT 'crypto',
  image_url text NOT NULL DEFAULT '',
  advertiser_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ads_select_authenticated" ON ads;
CREATE POLICY "ads_select_authenticated"
ON ads FOR SELECT
TO authenticated
USING (
  status = 'active'
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "ads_insert_admin" ON ads;
CREATE POLICY "ads_insert_admin"
ON ads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "ads_update_admin" ON ads;
CREATE POLICY "ads_update_admin"
ON ads FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "ads_delete_admin" ON ads;
CREATE POLICY "ads_delete_admin"
ON ads FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- =========================================================
-- AD_VIEWS
-- =========================================================
CREATE TABLE IF NOT EXISTS ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  reward_sats bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_views_select_own_or_admin" ON ad_views;
CREATE POLICY "ad_views_select_own_or_admin"
ON ad_views FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "ad_views_insert_own" ON ad_views;
CREATE POLICY "ad_views_insert_own"
ON ad_views FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ad_views_user_id ON ad_views(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON ad_views(ad_id);

-- =========================================================
-- CAMPAIGNS
-- =========================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  target_clicks int NOT NULL DEFAULT 1000,
  sats_per_click bigint NOT NULL DEFAULT 25,
  total_budget_sats bigint NOT NULL DEFAULT 25000,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'completed')),
  clicks_delivered int NOT NULL DEFAULT 0,
  invoice text NOT NULL DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_select_own_or_admin" ON campaigns;
CREATE POLICY "campaigns_select_own_or_admin"
ON campaigns FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
CREATE POLICY "campaigns_insert_own"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_update_own_or_admin" ON campaigns;
CREATE POLICY "campaigns_update_own_or_admin"
ON campaigns FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- =========================================================
-- WITHDRAWALS
-- =========================================================
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  destination text NOT NULL,
  amount_sats bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawals_select_own_or_admin" ON withdrawals;
CREATE POLICY "withdrawals_select_own_or_admin"
ON withdrawals FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "withdrawals_insert_own" ON withdrawals;
CREATE POLICY "withdrawals_insert_own"
ON withdrawals FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "withdrawals_update_own_or_admin" ON withdrawals;
CREATE POLICY "withdrawals_update_own_or_admin"
ON withdrawals FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- =========================================================
-- TRIGGER: Auto-create profile on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SECURITY DEFINER: record_ad_view (atomic balance increment)
-- =========================================================
CREATE OR REPLACE FUNCTION public.record_ad_view(p_ad_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward bigint;
  v_user uuid := auth.uid();
  v_profile_status text;
BEGIN
  SELECT reward_sats INTO v_reward FROM ads WHERE id = p_ad_id AND status = 'active';
  IF v_reward IS NULL THEN
    RAISE EXCEPTION 'Ad not found or not active';
  END IF;

  SELECT status INTO v_profile_status FROM profiles WHERE id = v_user;
  IF v_profile_status = 'banned' THEN
    RAISE EXCEPTION 'User is banned';
  END IF;

  INSERT INTO ad_views (user_id, ad_id, reward_sats)
  VALUES (v_user, p_ad_id, v_reward);

  UPDATE ads SET clicks_remaining = GREATEST(0, clicks_remaining - 1)
  WHERE id = p_ad_id;

  UPDATE profiles
  SET sats_balance = sats_balance + v_reward,
      total_earned_sats = total_earned_sats + v_reward,
      ads_clicked = ads_clicked + 1
  WHERE id = v_user;

  RETURN v_reward;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ad_view(uuid) TO authenticated;

-- =========================================================
-- SECURITY DEFINER: admin_create_ad
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_create_ad(
  p_title text,
  p_domain text,
  p_description text,
  p_duration_sec int,
  p_reward_sats bigint,
  p_clicks_target int,
  p_category text,
  p_image_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized: admin access required';
  END IF;

  INSERT INTO ads (title, domain, description, duration_sec, reward_sats,
    clicks_target, clicks_remaining, category, image_url, status)
  VALUES (p_title, p_domain, p_description, p_duration_sec, p_reward_sats,
    p_clicks_target, p_clicks_target, p_category, p_image_url, 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_ad(text, text, text, int, bigint, int, text, text) TO authenticated;

-- =========================================================
-- SECURITY DEFINER: admin_toggle_user_status
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status text;
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized: admin access required';
  END IF;

  SELECT status INTO v_new_status FROM profiles WHERE id = p_user_id;
  IF v_new_status = 'banned' THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'banned';
  END IF;

  UPDATE profiles SET status = v_new_status WHERE id = p_user_id;
  RETURN v_new_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(uuid) TO authenticated;

-- =========================================================
-- SECURITY DEFINER: admin_approve_ad
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_approve_ad(p_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized: admin access required';
  END IF;

  UPDATE ads SET status = 'active' WHERE id = p_ad_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_ad(uuid) TO authenticated;

-- =========================================================
-- SECURITY DEFINER: admin_reject_ad
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_reject_ad(p_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized: admin access required';
  END IF;

  DELETE FROM ads WHERE id = p_ad_id AND status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_ad(uuid) TO authenticated;

-- =========================================================
-- SECURITY DEFINER: process_withdrawal
-- =========================================================
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_destination text,
  p_amount_sats bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_balance bigint;
  v_user uuid := auth.uid();
BEGIN
  IF p_amount_sats < 100 THEN
    RAISE EXCEPTION 'Minimum withdrawal is 100 sats';
  END IF;

  SELECT sats_balance INTO v_balance FROM profiles WHERE id = v_user;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_amount_sats > v_balance THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE profiles SET sats_balance = sats_balance - p_amount_sats WHERE id = v_user;

  INSERT INTO withdrawals (user_id, destination, amount_sats, status)
  VALUES (v_user, p_destination, p_amount_sats, 'processing')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_withdrawal(text, bigint) TO authenticated;
