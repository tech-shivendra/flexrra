-- Create a security definer function to check admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_emails
    WHERE email = user_email
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view admin_emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));