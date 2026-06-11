-- ====================================================================
-- MIGRATION: Critical fix — admin cannot update profiles (RLS gap)
-- This is why "Pending" stays even after admin approves.
--
-- The schema has:
--   "Admins can read all profiles" → FOR SELECT USING (is_admin())
-- But ZERO UPDATE policy for admins on profiles.
-- Supabase RLS silently blocks the UPDATE, returns no error,
-- so the verify API returns success=true but profiles never change.
--
-- Run this in Supabase SQL Editor BEFORE the notifications migration.
-- ====================================================================

-- 1. Allow admins to UPDATE any profile (e.g., set verification_status)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. Allow admins to INSERT notifications for any user (verify API needs this)
--    (Skip if you already ran migration_notifications_rls.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Admins can insert notifications for any user'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can insert notifications for any user"
        ON public.notifications
        FOR INSERT
        WITH CHECK (public.is_admin(auth.uid()));
    $policy$;
  END IF;
END$$;

-- 3. Allow users to insert their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Users can insert own notifications'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can insert own notifications"
        ON public.notifications
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END$$;

-- 4. Explicit UPDATE policy for notifications (mark as read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
    AND policyname = 'Users can mark own notifications as read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can mark own notifications as read"
        ON public.notifications
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END$$;
