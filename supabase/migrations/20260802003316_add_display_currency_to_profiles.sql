/*
# Add display_currency column to profiles

1. Changes
- Adds `display_currency` text column to `profiles` table.
- Default value is 'sats' (the native unit the platform already uses).
- Allowed values: 'sats', 'btc', 'usd', 'eur' (enforced by CHECK constraint).
2. Security
- No new tables. Existing RLS policies on `profiles` already allow
  authenticated users to SELECT and UPDATE their own row, so the new
  column is automatically readable and updatable by the owning user.
- No policy changes needed.
3. Notes
- The column is nullable-safe with a default so existing rows get 'sats'.
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ guard.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_currency text NOT NULL DEFAULT 'sats';
    ALTER TABLE profiles ADD CONSTRAINT profiles_display_currency_check
      CHECK (display_currency IN ('sats', 'btc', 'usd', 'eur'));
  END IF;
END $$;
