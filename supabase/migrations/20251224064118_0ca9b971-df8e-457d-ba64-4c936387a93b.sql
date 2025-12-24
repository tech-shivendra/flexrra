-- Add sessions tracking columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS total_sessions integer NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS remaining_sessions integer NOT NULL DEFAULT 30;

-- Create gyms table to store gym data with unique QR codes
CREATE TABLE public.gyms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  pincode text,
  open_time text NOT NULL DEFAULT '06:00',
  close_time text NOT NULL DEFAULT '22:00',
  facilities text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  phone text,
  qr_code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on gyms table
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view gyms (public data)
CREATE POLICY "Anyone can view gyms" 
ON public.gyms 
FOR SELECT 
USING (true);

-- Update check_ins table to reference gyms table
ALTER TABLE public.check_ins 
ADD COLUMN IF NOT EXISTS session_deducted boolean DEFAULT true;