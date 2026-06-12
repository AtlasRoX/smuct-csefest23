-- ====================================================================
-- MIGRATION: Add Hero Section display configuration to public.competitions
-- Run this script in the Supabase SQL Editor.
-- ====================================================================

ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS show_in_hero BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS hero_capacity INTEGER DEFAULT 80;
