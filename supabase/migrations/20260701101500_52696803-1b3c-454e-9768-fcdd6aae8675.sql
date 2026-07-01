
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.admin_emails a ON a.email = u.email
    WHERE u.id = auth.uid()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view admin_emails" ON public.admin_emails;
CREATE POLICY "Admins can view admin_emails" ON public.admin_emails
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete gyms" ON public.gyms;
DROP POLICY IF EXISTS "Admins can insert gyms" ON public.gyms;
DROP POLICY IF EXISTS "Admins can update gyms" ON public.gyms;
DROP POLICY IF EXISTS "Authenticated users can view gyms" ON public.gyms;
CREATE POLICY "Authenticated users can view gyms" ON public.gyms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view active gyms" ON public.gyms
  FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "Admins insert gyms" ON public.gyms
  FOR INSERT TO authenticated WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins update gyms" ON public.gyms
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins delete gyms" ON public.gyms
  FOR DELETE TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON public.subscription_plans;
CREATE POLICY "Admins view all plans" ON public.subscription_plans
  FOR SELECT TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Admins insert plans" ON public.subscription_plans
  FOR INSERT TO authenticated WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins update plans" ON public.subscription_plans
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());
CREATE POLICY "Admins delete plans" ON public.subscription_plans
  FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- Column-level: hide qr_code and phone from regular users
REVOKE SELECT ON public.gyms FROM authenticated, anon;
GRANT SELECT (id, name, address, city, pincode, open_time, close_time,
              facilities, amenities, status, created_at)
  ON public.gyms TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.gyms TO authenticated;
GRANT ALL ON public.gyms TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_gyms()
RETURNS SETOF public.gyms
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.gyms ORDER BY created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_regenerate_gym_qr(p_gym_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_new text := gen_random_uuid()::text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.gyms SET qr_code = v_new WHERE id = p_gym_id;
  RETURN jsonb_build_object('success', true, 'qr_code', v_new);
END; $$;

-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_email_otps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.qr_check_in(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.manual_check_in(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pause_subscription() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resume_subscription() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.deduct_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_gyms() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_regenerate_gym_qr(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(text) FROM PUBLIC, anon, authenticated;

-- Storage: gym-images public URLs bypass RLS, restrict listing to admins
DROP POLICY IF EXISTS "Anyone can view gym images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gym images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gym images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gym images" ON storage.objects;

CREATE POLICY "Admins list gym images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'gym-images' AND public.is_current_user_admin());
CREATE POLICY "Admins upload gym images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gym-images' AND public.is_current_user_admin());
CREATE POLICY "Admins update gym images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gym-images' AND public.is_current_user_admin())
  WITH CHECK (bucket_id = 'gym-images' AND public.is_current_user_admin());
CREATE POLICY "Admins delete gym images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'gym-images' AND public.is_current_user_admin());
