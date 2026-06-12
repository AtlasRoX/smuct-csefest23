-- Migration: Dynamic Payment Gateway Configuration & Competition Rounds
-- Execute this script in the Supabase SQL Editor (manual execution)

-- 1. Drop check constraint on payments.method to allow dynamic options
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;

-- 2. Add rounds_count to competitions table
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS rounds_count INTEGER DEFAULT 1 CHECK (rounds_count IN (1, 2));

-- 3. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  number TEXT NOT NULL,
  instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
DROP POLICY IF EXISTS "Authenticated users can read payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can do everything on payment methods" ON public.payment_methods;

-- Allow all authenticated users to read payment methods
CREATE POLICY "Authenticated users can read payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow admins to do everything on payment methods
CREATE POLICY "Admins can do everything on payment methods" ON public.payment_methods
  USING (public.is_admin(auth.uid()));

-- 6. Seed default payment methods (bKash & Nagad)
INSERT INTO public.payment_methods (name, display_name, number, instructions, active)
VALUES 
  ('bkash', 'bKash Personal', '+880 1711-223344', 'Send the exact entry fee amount to the bKash personal number above via Send Money. Use your Team Name as the reference during transaction.', true),
  ('nagad', 'Nagad Personal', '+880 1711-223344', 'Send the exact entry fee amount to the Nagad personal number above via Send Money. Use your Team Name as the reference during transaction.', true)
ON CONFLICT (name) DO NOTHING;
