-- Add pause_count column to track number of pauses
ALTER TABLE public.subscriptions 
ADD COLUMN pause_count integer NOT NULL DEFAULT 0;