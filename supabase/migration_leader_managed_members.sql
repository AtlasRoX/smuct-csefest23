-- ====================================================================
-- MIGRATION: Leader-Managed Team Members (Nullable user_id & direct profile columns)
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- 1. Alter team_members table to make user_id nullable
ALTER TABLE public.team_members ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add profile and verification columns directly to team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS tshirt_size TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS portfolio TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS id_front_url TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS id_back_url TEXT;

-- 3. Add integrity constraints
-- Require either a user_id (for registered user/leader) OR all required fields for leader-added member details
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS chk_member_source;
ALTER TABLE public.team_members ADD CONSTRAINT chk_member_source
  CHECK (
    user_id IS NOT NULL OR (
      full_name IS NOT NULL AND 
      email IS NOT NULL AND 
      university IS NOT NULL AND 
      department IS NOT NULL AND 
      semester IS NOT NULL AND 
      student_id IS NOT NULL AND 
      tshirt_size IS NOT NULL AND
      id_front_url IS NOT NULL AND
      id_back_url IS NOT NULL
    )
  );

-- 4. Re-configure uniqueness indexes for team duplicates
-- Existing unique constraint was UNIQUE(team_id, user_id).
-- We drop it and create a conditional unique index instead.
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_team_id_user_id_key;

DROP INDEX IF EXISTS public.team_members_team_id_user_id_idx;
CREATE UNIQUE INDEX team_members_team_id_user_id_idx ON public.team_members (team_id, user_id) WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS public.team_members_team_id_email_idx;
CREATE UNIQUE INDEX team_members_team_id_email_idx ON public.team_members (team_id, email) WHERE email IS NOT NULL;

-- 4.5. Ensure profiles.skills is converted to TEXT if it is still an ARRAY (text[])
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'profiles' 
      AND column_name = 'skills' 
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.profiles 
      ALTER COLUMN skills TYPE TEXT USING CASE
        WHEN skills IS NULL THEN NULL
        ELSE array_to_string(skills, ', ')
      END;
  END IF;
END $$;

-- 5. Create coalescing View for seamless querying in both user portals and admin dashboards
CREATE OR REPLACE VIEW public.v_team_members AS
SELECT
  tm.id AS member_id,
  tm.team_id,
  tm.user_id,
  tm.role,
  tm.invitation_status,
  tm.verification_status,
  tm.joined_at,
  COALESCE(p.full_name, tm.full_name) AS full_name,
  COALESCE(u.email, tm.email) AS email,
  COALESCE(p.phone, tm.phone) AS phone,
  COALESCE(p.gender, tm.gender) AS gender,
  COALESCE(p.university, tm.university) AS university,
  COALESCE(p.department, tm.department) AS department,
  COALESCE(p.semester, tm.semester) AS semester,
  COALESCE(p.student_id, tm.student_id) AS student_id,
  COALESCE(p.github, tm.github) AS github,
  COALESCE(p.portfolio, tm.portfolio) AS portfolio,
  COALESCE(p.skills, tm.skills) AS skills,
  COALESCE(p.bio, tm.bio) AS bio,
  COALESCE(p.tshirt_size, tm.tshirt_size) AS tshirt_size,
  COALESCE(sv.id_front_url, tm.id_front_url) AS id_front_url,
  COALESCE(sv.id_back_url, tm.id_back_url) AS id_back_url
FROM public.team_members tm
LEFT JOIN public.users u ON tm.user_id = u.id
LEFT JOIN public.profiles p ON tm.user_id = p.id
LEFT JOIN public.student_verifications sv ON tm.user_id = sv.user_id;

-- 6. RLS: Grant permissions on the view so authenticated users can read details
GRANT SELECT ON public.v_team_members TO authenticated;
