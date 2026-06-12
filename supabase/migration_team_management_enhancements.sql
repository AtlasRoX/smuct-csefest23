-- ====================================================================
-- MIGRATION: Team Management Enhancements
-- Run this in the Supabase SQL Editor.
-- This supports allowing team leaders to disband/delete their teams.
-- ====================================================================

-- 1. Create RLS Policy to allow team leaders to delete/disband their teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'teams'
    AND policyname = 'Team leader can delete team'
  ) THEN
    CREATE POLICY "Team leader can delete team"
      ON public.teams
      FOR DELETE
      USING (auth.uid() = leader_id);
  END IF;
END$$;
