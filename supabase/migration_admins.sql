-- ====================================================================
-- MIGRATION: ADMIN ACCOUNT SYSTEM RESTRICTION
-- 
-- IMPORTANT: If you copy-paste this entire file and encounter a syntax error like
-- "syntax error at or near 'EX' / DROP POLICY IF EX", it means your browser or
-- clipboard truncated the query. 
--
-- To prevent this, copy and run the following 3 Chunks one by one.
-- ====================================================================


-- ====================================================================
-- CHUNK 1: TABLES, HELPER FUNCTION, & RLS ENABLING
-- ====================================================================

-- 1. Create the admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS on the admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Define the is_admin helper function (Security Definer to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ====================================================================
-- CHUNK 2: TRIGGERS FOR ROLE SYNCING
-- ====================================================================

-- 4. Create trigger to sync users.role when public.admins is modified
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.users
    SET role = 'admin'
    WHERE id = NEW.id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.users
    SET role = 'participant'
    WHERE id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_admin_role ON public.admins;
CREATE TRIGGER tr_sync_admin_role
AFTER INSERT OR DELETE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_role();

-- 5. Create trigger to enforce role consistency on public.users updates
CREATE OR REPLACE FUNCTION public.check_user_role_consistency()
RETURNS TRIGGER AS $$
DECLARE
  exists_in_admins BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = NEW.id) INTO exists_in_admins;

  IF exists_in_admins THEN
    NEW.role := 'admin';
  ELSE
    NEW.role := 'participant';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_user_role_consistency ON public.users;
CREATE TRIGGER tr_check_user_role_consistency
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.check_user_role_consistency();

-- 6. Safety Net: Re-sync existing roles based on the trigger logic
UPDATE public.users
SET role = CASE 
  WHEN EXISTS (SELECT 1 FROM public.admins WHERE id = public.users.id) THEN 'admin' 
  ELSE 'participant' 
END;


-- ====================================================================
-- CHUNK 3: RLS POLICY RE-CREATION
-- ====================================================================

-- ADMINS Table Policies
DROP POLICY IF EXISTS "Admins can view all admin records" ON public.admins;
CREATE POLICY "Admins can view all admin records" ON public.admins FOR SELECT USING (public.is_admin(auth.uid()));

-- USERS Table Policies
DROP POLICY IF EXISTS "Admins can view all records" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
CREATE POLICY "Admins can view all records" ON public.users FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update user roles" ON public.users FOR UPDATE USING (public.is_admin(auth.uid()));

-- PROFILES Table Policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- STUDENT_VERIFICATIONS Table Policies
DROP POLICY IF EXISTS "Admins can read/write all verifications" ON public.student_verifications;
CREATE POLICY "Admins can read/write all verifications" ON public.student_verifications USING (public.is_admin(auth.uid()));

-- COMPETITIONS Table Policies
DROP POLICY IF EXISTS "Admins can do everything on competitions" ON public.competitions;
CREATE POLICY "Admins can do everything on competitions" ON public.competitions USING (public.is_admin(auth.uid()));

-- TEAMS Table Policies
DROP POLICY IF EXISTS "Admins can do everything on teams" ON public.teams;
CREATE POLICY "Admins can do everything on teams" ON public.teams USING (public.is_admin(auth.uid()));

-- SUBMISSIONS Table Policies
DROP POLICY IF EXISTS "Admins can read/write all submissions" ON public.submissions;
CREATE POLICY "Admins can read/write all submissions" ON public.submissions USING (public.is_admin(auth.uid()));

-- PAYMENTS Table Policies
DROP POLICY IF EXISTS "Admins can review payments" ON public.payments;
CREATE POLICY "Admins can review payments" ON public.payments USING (public.is_admin(auth.uid()));

-- SCORES Table Policies
DROP POLICY IF EXISTS "Admins can read/write scores" ON public.scores;
CREATE POLICY "Admins can read/write scores" ON public.scores USING (public.is_admin(auth.uid()));

-- RANKINGS Table Policies
DROP POLICY IF EXISTS "Admins can read/write all rankings" ON public.rankings;
CREATE POLICY "Admins can read/write all rankings" ON public.rankings USING (public.is_admin(auth.uid()));

-- ANNOUNCEMENTS Table Policies
DROP POLICY IF EXISTS "Admin write announcements" ON public.announcements;
CREATE POLICY "Admin write announcements" ON public.announcements USING (public.is_admin(auth.uid()));

-- TICKER_ITEMS Table Policies
DROP POLICY IF EXISTS "Admin write ticker items" ON public.ticker_items;
CREATE POLICY "Admin write ticker items" ON public.ticker_items USING (public.is_admin(auth.uid()));

-- FAQS Table Policies
DROP POLICY IF EXISTS "Admin write faqs" ON public.faqs;
CREATE POLICY "Admin write faqs" ON public.faqs USING (public.is_admin(auth.uid()));

-- CONTACT_INFO Table Policies
DROP POLICY IF EXISTS "Admin write contact info" ON public.contact_info;
CREATE POLICY "Admin write contact info" ON public.contact_info USING (public.is_admin(auth.uid()));

-- AUDIT_LOGS Table Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System/Admins can write audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System/Admins can write audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
