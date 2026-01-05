-- Fix 1: Restrict gym data to authenticated users only (protects phone numbers from public scraping)
DROP POLICY IF EXISTS "Anyone can view gyms" ON public.gyms;

CREATE POLICY "Authenticated users can view gyms"
ON public.gyms
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Add restrictive policy for phone_otps table
-- OTPs are managed by edge functions using service role, not direct user access
CREATE POLICY "OTPs not directly accessible"
ON public.phone_otps
FOR SELECT
USING (false);