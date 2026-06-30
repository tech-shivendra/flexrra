
-- 1) COUPONS: remove public SELECT; provide secure validate_coupon RPC
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text)
RETURNS TABLE(code text, discount_percent integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code, c.discount_percent
  FROM public.coupons c
  WHERE upper(c.code) = upper(p_code)
    AND c.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO authenticated;

-- 2) CHECK_INS: remove direct INSERT policy; only RPC can write
DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.check_ins;

CREATE OR REPLACE FUNCTION public.qr_check_in(p_qr_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_gym RECORD;
  v_sub RECORD;
  v_existing uuid;
  v_new_remaining int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, name, address, city, status
    INTO v_gym
  FROM public.gyms
  WHERE qr_code = p_qr_code
  LIMIT 1;

  IF v_gym IS NULL OR v_gym.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid QR code. Gym not found.');
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = v_user AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found. Please purchase a plan.');
  END IF;
  IF v_sub.end_date < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription has expired');
  END IF;
  IF v_sub.remaining_sessions <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No sessions remaining. Please renew your subscription.');
  END IF;

  SELECT id INTO v_existing
  FROM public.check_ins
  WHERE user_id = v_user
    AND gym_id = v_gym.id::text
    AND check_in_time >= date_trunc('day', now())
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already checked in at this gym today!');
  END IF;

  INSERT INTO public.check_ins (user_id, gym_id, gym_name, gym_address, gym_city, check_in_type, status, session_deducted)
  VALUES (v_user, v_gym.id::text, v_gym.name, v_gym.address, v_gym.city, 'qr', 'checkedIn', true);

  v_new_remaining := v_sub.remaining_sessions - 1;
  UPDATE public.subscriptions SET remaining_sessions = v_new_remaining WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'success', true,
    'gym', jsonb_build_object('id', v_gym.id, 'name', v_gym.name, 'address', v_gym.address, 'city', v_gym.city),
    'remaining_sessions', v_new_remaining
  );
END;
$$;

REVOKE ALL ON FUNCTION public.qr_check_in(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qr_check_in(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.manual_check_in(p_gym_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_gym RECORD;
  v_sub RECORD;
  v_existing uuid;
  v_new_remaining int;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, name, address, city, status INTO v_gym
  FROM public.gyms WHERE id = p_gym_id LIMIT 1;
  IF v_gym IS NULL OR v_gym.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gym not found or inactive');
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions
  WHERE user_id = v_user AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found.');
  END IF;
  IF v_sub.end_date < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription has expired');
  END IF;
  IF v_sub.remaining_sessions <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No sessions remaining.');
  END IF;

  SELECT id INTO v_existing FROM public.check_ins
  WHERE user_id = v_user AND gym_id = v_gym.id::text
    AND check_in_time >= date_trunc('day', now()) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already checked in at this gym today!');
  END IF;

  INSERT INTO public.check_ins (user_id, gym_id, gym_name, gym_address, gym_city, check_in_type, status, session_deducted)
  VALUES (v_user, v_gym.id::text, v_gym.name, v_gym.address, v_gym.city, 'manual', 'checkedIn', true);

  v_new_remaining := v_sub.remaining_sessions - 1;
  UPDATE public.subscriptions SET remaining_sessions = v_new_remaining WHERE id = v_sub.id;

  RETURN jsonb_build_object('success', true, 'remaining_sessions', v_new_remaining);
END;
$$;

REVOKE ALL ON FUNCTION public.manual_check_in(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manual_check_in(uuid) TO authenticated;

-- 3) EMAIL_OTPS / PHONE_OTPS: lock down INSERT/UPDATE/DELETE for clients
CREATE POLICY "Block client OTP inserts" ON public.email_otps
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block client OTP updates" ON public.email_otps
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block client OTP deletes" ON public.email_otps
  FOR DELETE TO anon, authenticated USING (false);

CREATE POLICY "Block client phone OTP inserts" ON public.phone_otps
  FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block client phone OTP updates" ON public.phone_otps
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block client phone OTP deletes" ON public.phone_otps
  FOR DELETE TO anon, authenticated USING (false);

-- Add attempts counter for brute-force limiting on email_otps
ALTER TABLE public.email_otps ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- 4) GYMS: hide qr_code from regular users; provide admin RPCs
REVOKE SELECT (qr_code) ON public.gyms FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_gyms()
RETURNS SETOF public.gyms
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin((auth.jwt() ->> 'email')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.gyms ORDER BY created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_gyms() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_gyms() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_regenerate_gym_qr(p_gym_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new text := gen_random_uuid()::text;
BEGIN
  IF NOT public.is_admin((auth.jwt() ->> 'email')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.gyms SET qr_code = v_new WHERE id = p_gym_id;
  RETURN jsonb_build_object('success', true, 'qr_code', v_new);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_regenerate_gym_qr(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_gym_qr(uuid) TO authenticated;
