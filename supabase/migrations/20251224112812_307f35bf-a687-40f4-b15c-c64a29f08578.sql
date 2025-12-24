-- Create table to store OTPs
CREATE TABLE public.phone_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for quick phone lookups
CREATE INDEX idx_phone_otps_phone ON public.phone_otps(phone);

-- Enable RLS
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Allow public access for OTP operations (since users aren't authenticated yet)
CREATE POLICY "Allow public insert for OTPs"
ON public.phone_otps
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public select for OTPs"
ON public.phone_otps
FOR SELECT
USING (true);

CREATE POLICY "Allow public update for OTPs"
ON public.phone_otps
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete for OTPs"
ON public.phone_otps
FOR DELETE
USING (true);

-- Auto-cleanup old OTPs (optional trigger to clean up expired OTPs)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.phone_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_old_otps
AFTER INSERT ON public.phone_otps
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();