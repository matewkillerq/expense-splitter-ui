-- Add currency column to groups table
-- Run this in Supabase SQL Editor

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'ARS'));

-- Update existing groups to have USD as default
UPDATE public.groups 
SET currency = 'USD' 
WHERE currency IS NULL;
