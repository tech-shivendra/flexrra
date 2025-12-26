-- Create admin_emails table to whitelist admin users
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin_emails (bootstrap: insert via SQL first)
CREATE POLICY "Admins can view admin_emails"
  ON public.admin_emails
  FOR SELECT
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Create subscription_plans table for managing plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  sessions integer NOT NULL DEFAULT 30,
  price integer NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can insert plans"
  ON public.subscription_plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can update plans"
  ON public.subscription_plans
  FOR UPDATE
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can delete plans"
  ON public.subscription_plans
  FOR DELETE
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can view all plans"
  ON public.subscription_plans
  FOR SELECT
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Add admin policies to gyms table
CREATE POLICY "Admins can insert gyms"
  ON public.gyms
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can update gyms"
  ON public.gyms
  FOR UPDATE
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

CREATE POLICY "Admins can delete gyms"
  ON public.gyms
  FOR DELETE
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Add admin policies to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Add admin policies to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Add admin policies to view all check-ins
CREATE POLICY "Admins can view all check-ins"
  ON public.check_ins
  FOR SELECT
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails));

-- Trigger for updated_at on subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();