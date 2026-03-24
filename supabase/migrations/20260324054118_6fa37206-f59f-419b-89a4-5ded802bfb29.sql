
-- Remove the user INSERT policy on subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;

-- Add explicit deny SELECT policy on email_otps
CREATE POLICY "OTPs not directly accessible" ON public.email_otps FOR SELECT TO public USING (false);
