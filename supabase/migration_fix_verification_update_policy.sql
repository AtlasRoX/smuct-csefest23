-- Migration: Fix missing UPDATE policy on student_verifications
-- This resolves the "duplicate key value violates unique constraint student_verifications_user_id_key"
-- error that occurs when a user tries to resubmit their verification documents.
--
-- Root cause: The table had INSERT and SELECT RLS policies for users, but no UPDATE policy.
-- When upsert() was called and a row already existed, Postgres tried to INSERT a second row
-- (since the UPDATE path was blocked by RLS), triggering the unique constraint on user_id.

DROP POLICY IF EXISTS "Users can update own verification" ON public.student_verifications;

CREATE POLICY "Users can update own verification"
  ON public.student_verifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
