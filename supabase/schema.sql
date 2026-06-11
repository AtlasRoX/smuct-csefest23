-- ====================================================================
-- CSE FEST 2026 DATABASE SCHEMA
-- Execute this script in the Supabase SQL Editor (manual execution)
-- ====================================================================

-- 1. Create Enums / Type Constraints (Using CHECK constraints on columns for ease)
-- Status Enums used:
-- VerificationStatus: 'incomplete', 'pending', 'verified'
-- SubmissionStatus: 'draft', 'submitted', 'under_review', 'selected', 'rejected'
-- PaymentStatus: 'pending', 'approved', 'rejected', 'resubmission_required'
-- CompetitionStatus: 'draft', 'published', 'registration_open', 'registration_closed', 'archived'
-- TeamStatus: 'forming', 'registered', 'submitted', 'selected', 'rejected', 'finalist'

-- 2. Create Tables

-- public.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  gender TEXT,
  university TEXT,
  department TEXT,
  semester TEXT,
  student_id TEXT,
  github TEXT,
  portfolio TEXT,
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  tshirt_size TEXT,
  verification_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (verification_status IN ('incomplete', 'pending', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.student_verifications
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('incomplete', 'pending', 'verified')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.competitions
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Showcase', 'Programming', 'Security', 'Robotics', 'Esports', 'Custom')),
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  eligibility TEXT NOT NULL DEFAULT 'both' CHECK (eligibility IN ('internal', 'external', 'both')),
  solo_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  team_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  min_members INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 4,
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  submission_start TIMESTAMPTZ NOT NULL,
  submission_end TIMESTAMPTZ NOT NULL,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  payment_instructions TEXT,
  submission_required BOOLEAN NOT NULL DEFAULT TRUE,
  template_link TEXT,
  rulebook_url TEXT,
  judging_criteria JSONB NOT NULL DEFAULT '[]', -- Array of { name: string, weight: number }
  finalist_limit INTEGER NOT NULL DEFAULT 20,
  prize_pool TEXT,
  champion_prize TEXT,
  runner_up_prize TEXT,
  second_runner_up TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'registration_open', 'registration_closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.teams
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'registered', 'submitted', 'selected', 'rejected', 'finalist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, competition_id)
);

-- public.team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'rejected')),
  joined_at TIMESTAMPTZ,
  UNIQUE(team_id, user_id)
);

-- public.submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  google_docs_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'selected', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(team_id, competition_id)
);

-- public.payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  screenshot_url TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bkash', 'nagad')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmission_required')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.scores
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  criteria_name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  entered_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.rankings
CREATE TABLE IF NOT EXISTS public.rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  total_score NUMERIC NOT NULL DEFAULT 0,
  rank_position INTEGER,
  is_finalist BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'competition', 'results', 'deadline', 'emergency')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  publish_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.ticker_items
CREATE TABLE IF NOT EXISTS public.ticker_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.contact_info
CREATE TABLE IF NOT EXISTS public.contact_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  facebook TEXT,
  linkedin TEXT,
  address TEXT,
  maps_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- public.audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sync User Profile Trigger
-- Automatically populates users & profiles on auth signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'participant')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, user_id, full_name, verification_status)
  VALUES (new.id, new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), 'incomplete')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS)

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies

-- USERS Table Policies
CREATE POLICY "Users can view their own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all records" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update user roles" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- PROFILES Table Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- STUDENT_VERIFICATIONS Table Policies
CREATE POLICY "Users can read own verification" ON public.student_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own verification" ON public.student_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read/write all verifications" ON public.student_verifications USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- COMPETITIONS Table Policies
CREATE POLICY "Public read active competitions" ON public.competitions FOR SELECT USING (status != 'draft');
CREATE POLICY "Admins can do everything on competitions" ON public.competitions USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- TEAMS Table Policies
CREATE POLICY "Anyone can read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Team leader can create team" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Team leader can update team details" ON public.teams FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Admins can do everything on teams" ON public.teams USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- TEAM_MEMBERS Table Policies
CREATE POLICY "Anyone can read team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Leader/members can edit team invitations" ON public.team_members USING (auth.uid() = user_id);
CREATE POLICY "Team leaders can add/remove members" ON public.team_members USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = team_id AND leader_id = auth.uid()
  )
);

-- SUBMISSIONS Table Policies
CREATE POLICY "Team members can read own team submissions" ON public.submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = submissions.team_id AND user_id = auth.uid() AND invitation_status = 'accepted'
  )
);
CREATE POLICY "Team members can create/edit own submissions" ON public.submissions USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = submissions.team_id AND user_id = auth.uid() AND invitation_status = 'accepted'
  )
);
CREATE POLICY "Admins can read/write all submissions" ON public.submissions USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- PAYMENTS Table Policies
CREATE POLICY "Team members can read own team payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = payments.team_id AND user_id = auth.uid() AND invitation_status = 'accepted'
  )
);
CREATE POLICY "Team members can submit payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = payments.team_id AND user_id = auth.uid() AND invitation_status = 'accepted'
  )
);
CREATE POLICY "Admins can review payments" ON public.payments USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- SCORES Table Policies
CREATE POLICY "Team members can view own team scores" ON public.scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = scores.team_id AND user_id = auth.uid() AND invitation_status = 'accepted'
  )
);
CREATE POLICY "Admins can read/write scores" ON public.scores USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RANKINGS Table Policies
CREATE POLICY "Public read if rankings are public" ON public.rankings FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can read/write all rankings" ON public.rankings USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- NOTIFICATIONS Table Policies
CREATE POLICY "Users can read/write own notifications" ON public.notifications USING (auth.uid() = user_id);

-- CMS Tables Public Read, Admin Write Policies
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (status = 'published');
CREATE POLICY "Admin write announcements" ON public.announcements USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read ticker items" ON public.ticker_items FOR SELECT USING (active = true);
CREATE POLICY "Admin write ticker items" ON public.ticker_items USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (visible = true);
CREATE POLICY "Admin write faqs" ON public.faqs USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read contact info" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "Admin write contact info" ON public.contact_info USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- AUDIT_LOGS Table Policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System/Admins can write audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
