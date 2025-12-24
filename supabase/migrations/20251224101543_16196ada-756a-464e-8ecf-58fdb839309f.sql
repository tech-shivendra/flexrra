-- Allow authenticated users to insert coupons (admin functionality)
CREATE POLICY "Authenticated users can insert coupons"
ON public.coupons
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update coupons
CREATE POLICY "Authenticated users can update coupons"
ON public.coupons
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete coupons
CREATE POLICY "Authenticated users can delete coupons"
ON public.coupons
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view all coupons (including inactive)
CREATE POLICY "Authenticated users can view all coupons"
ON public.coupons
FOR SELECT
USING (auth.uid() IS NOT NULL);