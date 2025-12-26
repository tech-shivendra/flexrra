-- Add coupon tracking columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS original_price INTEGER,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER;