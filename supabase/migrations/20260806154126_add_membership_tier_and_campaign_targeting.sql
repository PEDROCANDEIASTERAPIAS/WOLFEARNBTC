/*
# Add membership tier + campaign targeting fields

1. Changes to profiles table
- Adds `membership_tier` text column (default 'normal').
- Allowed values: 'normal', 't1', 't2' (enforced by CHECK).
- T1/T2 members get higher minimum sats-per-click (5 sats) on campaigns.

2. Changes to campaigns table
- Adds `duration_sec` integer column (default 30) — the ad view duration.
- Adds `target_audience` text column (default 'all') — audience targeting.
- Allowed target_audience values: 'all', 't1_t2' (enforced by CHECK).
- When target_audience = 't1_t2', the campaign cost has a +50% surcharge.

3. Security
- No new tables. Existing RLS policies already cover SELECT/INSERT/UPDATE
  on profiles (owner-scoped) and campaigns (owner-scoped). New columns are
  automatically accessible under existing policies.
- No policy changes needed.

4. Notes
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ guards.
- membership_tier defaults to 'normal' so existing users keep current behavior.
- duration_sec and target_audience have safe defaults for existing campaigns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'membership_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN membership_tier text NOT NULL DEFAULT 'normal';
    ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check
      CHECK (membership_tier IN ('normal', 't1', 't2'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'duration_sec'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN duration_sec int NOT NULL DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN target_audience text NOT NULL DEFAULT 'all';
    ALTER TABLE campaigns ADD CONSTRAINT campaigns_target_audience_check
      CHECK (target_audience IN ('all', 't1_t2'));
  END IF;
END $$;
