/*
# Revoke anon EXECUTE on admin and user functions

## Problem
The SECURITY DEFINER functions were granted EXECUTE to both anon and
authenticated roles. While each function internally checks is_admin or
auth.uid(), defense-in-depth dictates that anon (unauthenticated) should
not be able to call any of these functions at all.

## Fix
Revoke EXECUTE from anon on all 6 SECURITY DEFINER functions. Keep
authenticated EXECUTE so logged-in users can call record_ad_view and
process_withdrawal, and admins can call the admin_* functions.
*/

REVOKE EXECUTE ON FUNCTION public.admin_approve_ad(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_ad(text, text, text, int, bigint, int, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_ad(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_user_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_withdrawal(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_ad_view(uuid) FROM anon;
