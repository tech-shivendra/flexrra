-- Lock down OTP table: remove public policies (service role bypasses RLS)
DROP POLICY IF EXISTS "Allow public insert for OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Allow public select for OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Allow public update for OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Allow public delete for OTPs" ON public.phone_otps;

-- Ensure RLS remains enabled
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No public policies: only backend (service role) should access
