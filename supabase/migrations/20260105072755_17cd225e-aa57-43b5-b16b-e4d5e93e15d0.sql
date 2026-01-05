-- Create email_otps table for email-based OTP verification
CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
-- (edge functions use service role key)

-- Create index for faster lookups
CREATE INDEX idx_email_otps_email ON public.email_otps(email);
CREATE INDEX idx_email_otps_expires_at ON public.email_otps(expires_at);

-- Create cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_email_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

-- Create trigger to cleanup expired OTPs on insert
CREATE TRIGGER cleanup_email_otps_trigger
AFTER INSERT ON public.email_otps
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_email_otps();