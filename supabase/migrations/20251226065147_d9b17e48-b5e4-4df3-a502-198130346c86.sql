-- Create storage bucket for gym images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gym-images', 'gym-images', true);

-- Create table to store gym images
CREATE TABLE public.gym_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gym_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view gym images
CREATE POLICY "Anyone can view gym images"
ON public.gym_images
FOR SELECT
USING (true);

-- Only admins can manage gym images
CREATE POLICY "Admins can insert gym images"
ON public.gym_images
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update gym images"
ON public.gym_images
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete gym images"
ON public.gym_images
FOR DELETE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

-- Storage policies for gym images bucket
CREATE POLICY "Anyone can view gym images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gym-images');

CREATE POLICY "Admins can upload gym images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gym-images' AND public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update gym images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gym-images' AND public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete gym images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gym-images' AND public.is_admin(auth.jwt() ->> 'email'));