CREATE OR REPLACE FUNCTION public.expire_my_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_updated int := 0;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE public.subscriptions
     SET status = 'expired'
   WHERE user_id = v_user
     AND status IN ('active','paused')
     AND end_date IS NOT NULL
     AND end_date < now();
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE public.profiles
     SET subscription_status = 'inactive',
         updated_at = now()
   WHERE id = v_user
     AND subscription_end_date IS NOT NULL
     AND subscription_end_date < now()
     AND subscription_status <> 'inactive';

  RETURN jsonb_build_object('success', true, 'expired_count', v_updated);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_my_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_my_subscription() TO authenticated;