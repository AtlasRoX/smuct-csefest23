-- ====================================================================
-- SEED DATA FOR CSE FEST 2026 CMS & COMPETITIONS
-- Execute this script in the Supabase SQL Editor to populate tables.
-- You can edit values here and re-run this script; conflicts are resolved
-- by updating existing rows dynamically.
-- ====================================================================

-- 1. Seed contact_info
INSERT INTO public.contact_info (id, email, phone, facebook, linkedin, address, maps_url)
VALUES (
  'd3b10b00-c0c0-4c1d-b0f0-c0c0c0c0c0c0',
  'csefest2026@smuct.edu.bd',
  '+880 1711-223344',
  'https://facebook.com/smuct.csefest',
  'https://linkedin.com/school/smuct',
  'Plot 3, Sector 15, Uttara, Dhaka, Bangladesh',
  'https://maps.app.goo.gl/GQY48WmKwuSSwanCA'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  facebook = EXCLUDED.facebook,
  linkedin = EXCLUDED.linkedin,
  address = EXCLUDED.address,
  maps_url = EXCLUDED.maps_url,
  updated_at = NOW();

-- 2. Seed faqs
INSERT INTO public.faqs (id, question, answer, display_order, visible)
VALUES 
(
  'fa000000-0000-0000-0000-000000000001',
  'Who is eligible to join the External Competitions?',
  'Students currently enrolled in any undergraduate program at a registered university in Bangladesh can participate in the Software Showcase, IoT Showcase, and Idea Showcase.',
  1,
  true
),
(
  'fa000000-0000-0000-0000-000000000002',
  'What is the team size limit for showcases?',
  'Software Showcase and Idea Showcase allow 1-3 members per team. IoT Showcase supports up to 4 members. Competitive Programming, Datathon, and Capture The Flag support 1-3 members.',
  2,
  true
),
(
  'fa000000-0000-0000-0000-000000000003',
  'How does the manual payment verification work?',
  'Once selected for Phase 2, team leaders must pay the registration fee via bKash or Nagad and upload the transaction screenshot along with the Transaction ID. Admins verify this proof manually.',
  3,
  true
),
(
  'fa000000-0000-0000-0000-000000000004',
  'What are the rules for internal SMUCT participants?',
  'SMUCT students can join any internal competition (Programming, Datathon, CTF, Robo Soccer, LFR, Esports). Roster validation will verify SMUCT student status during registration.',
  4,
  true
)
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  display_order = EXCLUDED.display_order,
  visible = EXCLUDED.visible;

-- 3. Seed ticker_items
INSERT INTO public.ticker_items (id, message, pinned, active)
VALUES 
(
  'db000000-0000-0000-0000-000000000001',
  'Registration is now OPEN for Software, IoT, and Idea Showcases!', 
  true, 
  true
),
(
  'db000000-0000-0000-0000-000000000002',
  'Attention SMUCT students: Internal Programming, Datathon, and CTF registration is active.', 
  false, 
  true
),
(
  'db000000-0000-0000-0000-000000000003',
  'Phase 2 Proposal Submissions close on June 30, 2026. Submit early!', 
  false, 
  true
),
(
  'db000000-0000-0000-0000-000000000004',
  'Manual verification process takes up to 24-48 hours after document upload.', 
  false, 
  true
)
ON CONFLICT (id) DO UPDATE SET
  message = EXCLUDED.message,
  pinned = EXCLUDED.pinned,
  active = EXCLUDED.active;

-- 4. Seed competitions (Software Showcase, IoT Showcase, Idea Showcase)
INSERT INTO public.competitions (
  id, name, type, description, short_description, eligibility, 
  solo_allowed, team_allowed, min_members, max_members, 
  registration_start, registration_end, submission_start, submission_end, 
  entry_fee, status, prize_pool, champion_prize, runner_up_prize, second_runner_up,
  show_in_hero, short_name, hero_capacity
)
VALUES 
(
  'e0bb66f8-45e0-4c12-a1f7-418f773b069d',
  'Software Project Showcase',
  'Showcase',
  'The Software Showcase offers student innovators the opportunity to pitch full-scale software solutions. Projects are evaluated on innovation, usability, technical depth, and architectural scalability.',
  'Demonstrate cutting-edge web, mobile, and system-level applications to a panel of expert judges.',
  'external',
  true,
  true,
  1,
  3,
  '2026-06-15T00:00:00Z',
  '2026-06-30T23:59:59Z',
  '2026-06-15T00:00:00Z',
  '2026-07-10T23:59:59Z',
  1500,
  'published',
  '1,50,000 BDT',
  '75,000 BDT',
  '50,000 BDT',
  '25,000 BDT',
  true,
  'SOFT',
  85
),
(
  '318a4a58-89c0-449e-ba60-318df883ba58',
  'IoT Showcase',
  'Showcase',
  'The IoT Showcase features hardware integrations addressing real-world problems. Projects must demonstrate operational physical hardware connected to cloud or local network telemetry.',
  'Showcase smart physical devices, embedded systems, and interconnected hardware solutions.',
  'external',
  true,
  true,
  1,
  4,
  '2026-06-15T00:00:00Z',
  '2026-06-30T23:59:59Z',
  '2026-06-15T00:00:00Z',
  '2026-07-10T23:59:59Z',
  2000,
  'published',
  '1,80,000 BDT',
  '90,000 BDT',
  '60,000 BDT',
  '30,000 BDT',
  true,
  'IoT',
  75
),
(
  'dfec0659-6308-42e3-aaf6-dfdc85eb2cfa',
  'Idea Showcase',
  'Showcase',
  'The Idea Showcase is dedicated to visionary tech product concepts. Submissions are judged on market viability, problem-solution fit, and presentation pitch quality.',
  'Pitch disruptive startup concepts, system designs, or technology solutions addressing global challenges.',
  'external',
  true,
  true,
  1,
  3,
  '2026-06-15T00:00:00Z',
  '2026-06-30T23:59:59Z',
  '2026-06-15T00:00:00Z',
  '2026-07-10T23:59:59Z',
  1000,
  'published',
  '90,000 BDT',
  '45,000 BDT',
  '30,000 BDT',
  '15,000 BDT',
  true,
  'IDEA',
  90
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  eligibility = EXCLUDED.eligibility,
  solo_allowed = EXCLUDED.solo_allowed,
  team_allowed = EXCLUDED.team_allowed,
  min_members = EXCLUDED.min_members,
  max_members = EXCLUDED.max_members,
  registration_start = EXCLUDED.registration_start,
  registration_end = EXCLUDED.registration_end,
  submission_start = EXCLUDED.submission_start,
  submission_end = EXCLUDED.submission_end,
  entry_fee = EXCLUDED.entry_fee,
  status = EXCLUDED.status,
  prize_pool = EXCLUDED.prize_pool,
  champion_prize = EXCLUDED.champion_prize,
  runner_up_prize = EXCLUDED.runner_up_prize,
  second_runner_up = EXCLUDED.second_runner_up,
  show_in_hero = EXCLUDED.show_in_hero,
  short_name = EXCLUDED.short_name,
  hero_capacity = EXCLUDED.hero_capacity;
