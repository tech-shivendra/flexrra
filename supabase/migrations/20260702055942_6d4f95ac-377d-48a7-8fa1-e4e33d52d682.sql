-- 1) Replace is_admin(auth.jwt()->>'email') with is_current_user_admin()
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
CREATE POLICY "Admins can view all check-ins" ON public.check_ins
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can insert gym images" ON public.gym_images;
CREATE POLICY "Admins can insert gym images" ON public.gym_images
  FOR INSERT TO authenticated WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update gym images" ON public.gym_images;
CREATE POLICY "Admins can update gym images" ON public.gym_images
  FOR UPDATE TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete gym images" ON public.gym_images;
CREATE POLICY "Admins can delete gym images" ON public.gym_images
  FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- 2) is_admin(text) is no longer referenced by RLS; lock it down.
REVOKE EXECUTE ON FUNCTION public.is_admin(text) FROM PUBLIC, anon, authenticated;

-- 3) Move gym phone numbers to an admin-only table.
CREATE TABLE IF NOT EXISTS public.gym_contacts (
  gym_id uuid PRIMARY KEY REFERENCES public.gyms(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_contacts TO authenticated;
GRANT ALL ON public.gym_contacts TO service_role;

ALTER TABLE public.gym_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gym contacts" ON public.gym_contacts
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER trg_gym_contacts_updated_at
  BEFORE UPDATE ON public.gym_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing phone numbers, then drop the column from gyms.
INSERT INTO public.gym_contacts (gym_id, phone)
SELECT id, phone FROM public.gyms WHERE phone IS NOT NULL
ON CONFLICT (gym_id) DO UPDATE SET phone = EXCLUDED.phone;

ALTER TABLE public.gyms DROP COLUMN IF EXISTS phone;