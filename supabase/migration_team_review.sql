-- ====================================================================
-- CSE FEST 2026 — Team Review Migration
-- Run in Supabase SQL Editor
-- ====================================================================

-- 1. Add profile_complete flag to profiles
--    This replaces the verification_status gate for platform access.
--    Participants can use the platform as soon as their profile is complete.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add leader_confirmed flag to teams
--    Team leader must explicitly confirm leadership before submissions are unlocked.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS leader_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Add verification_status to team_members
--    Tracks per-member admin approval during the team review process.
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- 4. Extend teams.status CHECK constraint to include 'judging_ready'
--    Flow: forming -> registered -> submitted -> judging_ready (all members approved) / rejected
ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_status_check;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_status_check
  CHECK (status IN ('forming', 'registered', 'submitted', 'selected', 'rejected', 'finalist', 'judging_ready'));

-- 5. RLS: Allow admins to update team_members.verification_status
--    (Existing admin policy on team_members only covers team leaders — add explicit admin policy)
DROP POLICY IF EXISTS "Admins can manage team member verification" ON public.team_members;
CREATE POLICY "Admins can manage team member verification" ON public.team_members
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can read all team members" ON public.team_members;
CREATE POLICY "Admins can read all team members" ON public.team_members
  FOR SELECT USING (public.is_admin(auth.uid()));


-- 6. RLS: Allow admins to update teams.status (for judging_ready transition)
DROP POLICY IF EXISTS "Admins can update team status" ON public.teams;
CREATE POLICY "Admins can update team status" ON public.teams
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Done
