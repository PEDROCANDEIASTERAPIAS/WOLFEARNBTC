/*
# Revoke anon EXECUTE on SECURITY DEFINER functions

The anon role should not be able to call any of these functions. Each
function internally checks auth.uid() or is_admin(), but defense-in-depth
dictates anon should not have EXECUTE at all.
*/

REVOKE EXECUTE ON FUNCTION public.admin_approve_ad(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_ad(text, text, text, int, bigint, int, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_ad(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_user_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_withdrawal(text, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_ad_view(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
