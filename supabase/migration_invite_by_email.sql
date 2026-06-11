-- ====================================================================
-- MIGRATION: Team Invitations and Teammate Profiles
-- Run this in the Supabase SQL Editor.
-- This supports looking up invitees by email and allowing team members
-- to see each other's user and profile details.
-- ====================================================================

-- 1. Create the RPC helper to securely look up user ID by email (bypassing RLS for validation)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(target_email TEXT)
RETURNS UUID AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id 
  FROM public.users 
  WHERE email = target_email;
  
  RETURN target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing policies if they exist to avoid duplicate issues
DROP POLICY IF EXISTS "Users can view team members records" ON public.users;
DROP POLICY IF EXISTS "Users can view team members profiles" ON public.profiles;

-- 3. Create RLS Policy to allow team members to select users records of fellow teammates
CREATE POLICY "Users can view team members records"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = public.users.id
  )
);

-- 4. Create RLS Policy to allow team members to select profiles of fellow teammates
CREATE POLICY "Users can view team members profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = public.profiles.id
  )
);
