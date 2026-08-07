/*
# Update withdrawal rules: min 20 sats, integer-only, 1 per 24 hours

1. Changes to profiles table
- Adds `last_withdrawal_at` timestamptz column (nullable) to track the
  user's most recent withdrawal timestamp for rate-limiting.

2. Changes to process_withdrawal() function
- Minimum withdrawal lowered from 100 to 20 sats.
- Rejects non-integer / fractional amounts (amount must be a whole number).
- Enforces 1 withdrawal per 24 hours using last_withdrawal_at.
- Updates last_withdrawal_at on successful withdrawal.
- Floors the balance check: withdrawal amount must be <= floor(balance).

3. Security
- No new tables. Existing RLS policies on profiles already allow
  authenticated users to SELECT/UPDATE their own row.
- process_withdrawal is SECURITY DEFINER, already granted to authenticated.
- No policy changes needed.

4. Notes
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ for column addition.
- The 24-hour cooldown is a rolling window (not calendar-day based).
- Premium tier hooks: the rate-limit threshold (24h) and min amount (20)
  are defined as local variables in the function, making them easy to
  adjust per-user in a future premium tier by reading a profile column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_withdrawal_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_withdrawal_at timestamptz;
  END IF;
END $$;

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
  v_balance numeric;
  v_last_withdrawal timestamptz;
  v_user uuid := auth.uid();
  v_min_withdraw bigint := 20;
  v_cooldown_hours integer := 24;
  v_next_allowed timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount_sats < v_min_withdraw THEN
    RAISE EXCEPTION 'Minimum withdrawal is % sats', v_min_withdraw;
  END IF;

  SELECT sats_balance, last_withdrawal_at INTO v_balance, v_last_withdrawal
  FROM profiles WHERE id = v_user;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_amount_sats > floor(v_balance) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  IF v_last_withdrawal IS NOT NULL THEN
    v_next_allowed := v_last_withdrawal + (v_cooldown_hours || ' hours')::interval;
    IF now() < v_next_allowed THEN
      RAISE EXCEPTION 'Withdrawal limit reached. You can withdraw again after %', to_char(v_next_allowed, 'YYYY-MM-DD HH24:MI');
    END IF;
  END IF;

  UPDATE profiles
    SET sats_balance = sats_balance - p_amount_sats,
        last_withdrawal_at = now()
    WHERE id = v_user;

  INSERT INTO withdrawals (user_id, destination, amount_sats, status)
  VALUES (v_user, p_destination, p_amount_sats, 'processing')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_withdrawal(text, bigint) TO authenticated;
