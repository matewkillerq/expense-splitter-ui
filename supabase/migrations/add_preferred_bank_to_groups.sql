-- Add preferred_bank column to groups table
-- Run this in Supabase SQL Editor

ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS preferred_bank TEXT CHECK (preferred_bank IN ('REVOLUT', 'SANTANDER', 'BBVA', 'CAIXABANK', 'MERCADOPAGO'));
