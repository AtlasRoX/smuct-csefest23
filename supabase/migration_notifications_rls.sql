-- ====================================================================
-- MIGRATION: Fix notifications RLS so admin verify API can insert
-- rows for participants (auth.uid() != user_id on server-side requests)
-- Run this in the Supabase SQL Editor.
-- ====================================================================

-- The existing policy "Users can read/write own notifications" applies
-- to SELECT/UPDATE/DELETE only when auth.uid() = user_id.
-- But the admin verify API needs to INSERT a notification for a *different*
-- user, which is not covered. We add a dedicated INSERT policy for admins.

CREATE POLICY "Admins can insert notifications for any user"
  ON public.notifications
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Also ensure participants can INSERT their own notifications
-- (in case they are ever created client-side in the future)
CREATE POLICY "Users can insert own notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant participants explicit SELECT on their own notifications
-- (the USING policy already covers this, but being explicit is safer)
CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
