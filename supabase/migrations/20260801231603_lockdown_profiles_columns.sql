/*
# Lock down profiles columns — prevent privilege escalation

## Problem
The profiles UPDATE policy (profiles_update_own) allows users to update any
column on their own row, including is_admin, sats_balance, total_earned_sats,
status, and ads_clicked. A malicious user could escalate themselves to admin
or inflate their balance.

## Fix
Revoke UPDATE on sensitive columns from the authenticated role, leaving only
username and avatar_hue user-editable. All sensitive columns are modified
exclusively through SECURITY DEFINER functions (record_ad_view,
process_withdrawal, admin_toggle_user_status) which run with elevated
privileges and bypass column-level grants.

## Columns locked down
- is_admin (privilege escalation)
- sats_balance (balance inflation)
- total_earned_sats (earnings inflation)
- ads_clicked (stats inflation)
- referral_earnings_sats (referral inflation)
- status (self-ban/unban)
- referral_code (should be system-generated)

## Columns still user-editable
- username
- avatar_hue
*/

REVOKE UPDATE (is_admin, sats_balance, total_earned_sats, ads_clicked, referral_earnings_sats, status, referral_code) ON profiles FROM authenticated;
REVOKE UPDATE (is_admin, sats_balance, total_earned_sats, ads_clicked, referral_earnings_sats, status, referral_code) ON profiles FROM anon;
