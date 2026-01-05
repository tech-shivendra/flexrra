-- Fix coupons table RLS policies to require admin for management operations

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can view all coupons" ON public.coupons;

-- Create admin-only policies for coupon management
CREATE POLICY "Admins can insert coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can update coupons" 
ON public.coupons 
FOR UPDATE 
USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can delete coupons" 
ON public.coupons 
FOR DELETE 
USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can view all coupons" 
ON public.coupons 
FOR SELECT 
USING (is_admin((auth.jwt() ->> 'email'::text)));