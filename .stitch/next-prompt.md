# Google Stitch Master Blueprint: CSE Fest 2026 Tech Platform

This document serves as the master specification, project context, and generation blueprint for building the **CSE Fest 2026 Technology Festival Platform**. It is structured for Google Stitch to generate every client page and component one by one with a cohesive visual design system, explicit state workflows, and strict validation.

---

## 1. Core Visual Architecture & Design System (DESIGN.md Alignment)

Every page must respect the design parameters below. **Do not use hardcoded colors or sizing values.** All classes must reference design tokens.

### A. Color & Surface Mapping (HSL Tokens)
The site supports **Light Mode** by default and **Dark Mode** via the `.dark` class. The color system uses inverted neutral roles to swap backgrounds and texts perfectly:

| Token | Light Mode Value (Root) | Dark Mode Value (.dark) | UI Role / Usage |
|---|---|---|---|
| `--color-primary` | `hsl(243, 75%, 59%)` | `hsl(243, 75%, 59%)` | Primary Indigo: Brand, major CTAs |
| `--color-secondary` | `hsl(270, 95%, 60%)` | `hsl(270, 95%, 60%)` | Electric Violet: Accents, metrics, statistics |
| `--color-accent` | `hsl(180, 85%, 35%)` | `hsl(180, 85%, 65%)` | Cyan: Success states, active tags, interactive items |
| `--neutral-950` | `hsl(240, 15%, 97%)` | `hsl(240, 10%, 4%)` | Surface 1: Main page background |
| `--neutral-900` | `hsl(0, 0%, 100%)` | `hsl(240, 10%, 7%)` | Surface 2: Card background |
| `--neutral-850` | `hsl(240, 8%, 93%)` | `hsl(240, 10%, 9%)` | Component Borders |
| `--neutral-800` | `hsl(240, 8%, 89%)` | `hsl(240, 10%, 12%)` | Surface 3: Elevated elements, sub-inputs |
| `--neutral-700` | `hsl(240, 6%, 83%)` | `hsl(240, 10%, 18%)` | Surface 4: Modal cards |
| `--neutral-600` | `hsl(240, 5%, 60%)` | `hsl(240, 5%, 35%)` | Muted Text (low contrast) |
| `--neutral-500` | `hsl(240, 5%, 45%)` | `hsl(240, 5%, 48%)` | Mid Text |
| `--neutral-400` | `hsl(240, 6%, 32%)` | `hsl(240, 5%, 65%)` | Muted Light Text / Secondary Text |
| `--neutral-200` | `hsl(240, 10%, 12%)` | `hsl(240, 5%, 90%)` | High Contrast Text |
| `--neutral-50` | `hsl(240, 10%, 4%)` | `hsl(0, 0%, 98%)` | Surface 5: High contrast text (headings) |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(10, 10, 12, 0.7)` | Glassmorphic Background |
| `--glass-border` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.08)` | Glassmorphic Borders |

### B. Typography Strategy
- **Headings**: **Space Grotesk** (geometric, technical font for titles, cards, navigation items)
- **Body & Labels**: **Inter** (highly legible sans-serif for descriptions, labels, form entries)
- **Data & Numbers**: **Geist Mono** (tabular numbers for metrics, countdowns, timestamps, scoring)

### C. Glassmorphism Rules
Glassmorphic elements (`bg-glass border-glass backdrop-blur-md`) are allowed **exclusively** on the **Navbar**, **News Ticker**, **Modals**, **Hero elements**, and **Dashboard Stats Cards**. They are strictly **forbidden** on forms, inputs, tables, and dense data panels to preserve readability.

---

## 2. Interactive Page Blueprints

Generate the routing folders under `src/app/` using these exact specifications.

### ROUTE GROUP A: `(public)` — Marketing & Catalog

#### 1. Landing Page (`/` -> `src/app/(public)/page.tsx`)
- **Header Navigation**: Fixed glassmorphic navbar with logo, smooth-scroll links, theme toggler (Sun/Moon icons changing `document.documentElement` class between `light`/`dark`), and user session action button (Redirect to `/login` or `/dashboard`).
- **News Ticker**: Mounted just below the header (`NewsTicker`). Reads announcements dynamically via SWR `/api/public/cms/ticker`. Uses theme-aware `var(--neutral-900)` fades on the left and right edges.
- **Hero Section (`HeroSection`)**: 100vh layout with background theme-aware tech grid (`bg-grid-pattern`) and floating orbs animating slowly. 
  - *Left Column*: Eyebrow badge ("Registrations Open"), giant typography title ("CSE FEST 2026"), responsive countdown strip (`CountdownStrip`) with safe hydration guard, key stats card grid (separators created via `gap-px bg-neutral-300 dark:bg-neutral-800`), and dual CTA buttons.
  - *Right Column*: Cyber Console. A mock terminal workspace with window control dots and tabs:
    - *Overview*: Clickable switches for competition showcases (Software, IoT, Ideas, Competitive Programming, CTF). Includes details, highlights, and entry fees.
    - *Interactive CLI*: Auto-running logs simulating supabase API calls, verified student ID checks, and registration validations. Includes a "Restart Simulation" action button.
    - *Top Teams*: Scoreboard preview table detailing ranking lists, teams, and scores.
- **About Section**: Multi-column text section detailing the festival's organization by CSE and CSIT departments at SMUCT, alongside a card grid outlining prize pools and participant statistics.
- **Virtual Campus Map (`CampusMap`)**: Interactive SVG/canvas panel displaying SMUCT buildings, classrooms, and exhibition zones (Showcase Halls, CP Labs, Esports Arena). Hovering over zones highlights active competitions.
- **Accordion FAQ**: Clean list using framer-motion `height` transition for expanded states.

#### 2. Competitions Directory (`/competitions` -> `src/app/(public)/competitions/page.tsx`)
- **Filter Dashboard**: Search input combined with category buttons (All, External Showcases, Internal SMUCT-Only) and status pills (Open, Closed).
- **Cards Grid**: Staggered cards featuring cover image, name, short description, prize pool, team limits, and a clean secondary button link to `/competitions/[id]`.

#### 3. Competition details (`/competitions/[id]` -> `src/app/(public)/competitions/[id]/page.tsx`)
- **Editorial Header**: Banner displaying status badge ("Registrations Open", "Registration Closed"), title, and primary CTA ("Register Your Team").
- **Tab Layout**:
  - *Overview*: In-depth explanation of the track.
  - *Rules*: PDF rulebook viewer frame or formatted lists.
  - *Timeline*: Stage-by-stage date timeline.
  - *Prizes*: Detailed split structure for 1st, 2nd, and 3rd positions.
- **Sticky Rules Sidebar**: Displays fast-reference details: Team Size, Entry Fee, Eligibility, and Deadline.

#### 4. Finalists Announcement (`/finalists` -> `src/app/(public)/finalists/page.tsx`)
- Displays team selections per competition, featuring search and filter tags grouped by academic institutions.

---

### ROUTE GROUP B: `(auth)` — Authentication & Setup

#### 1. Login & Sign Up (`/login` -> `src/app/(auth)/login/page.tsx` & `/register`)
- Split-screen editorial layout.
  - *Left Side (60%)*: Immersive visual panel displaying the CSE Fest '26 logo, floating technology graphics, and high-impact key statistics.
  - *Right Side (40%)*: Standard card layout. Includes a large "Continue with Google" OAuth button, an email/password form, form validation errors, and redirects.

#### 2. Profile Setup Wizard (`/profile-wizard` -> `src/app/(auth)/profile-wizard/page.tsx`)
- Step-by-step registration wizard. Must block access to dashboards until submitted.
  - *Step 1: Personal*: Full Name, Email, Phone, Gender.
  - *Step 2: Academic*: University search select, Department, Semester, Student ID.
  - *Step 3: Student Verification*: File upload zone for Student ID Card (Front and Back). Supports drag-and-drop, preview thumbnails, file size limit (5MB), and progress bar.
  - *Step 4: Professional*: Links (GitHub, Portfolio, LinkedIn) and custom tags/skills selection.
  - *Step 5: Review*: Summary list of all entered details with a prominent "Submit Profile" action.

---

### ROUTE GROUP C: `(participant)` — User Dashboard (Mobile-First)

#### 1. Dashboard Overview (`/dashboard` -> `src/app/(participant)/dashboard/page.tsx`)
- Collapsible sidebar for desktop; bottom bar navigation (`Home`, `Teams`, `Submissions`, `Notifications`) for mobile.
- **Widgets Layout**:
  - *Verification Banner*: Displays alert banners depending on status (Red for "Action Needed: Please Complete Profile", Yellow for "Verification Pending", Green Check for "Verified").
  - *My Teams Grid*: Overview of teams created or joined.
  - *Deadlines Timeline*: Clean linear calendar listing countdowns for submissions.
  - *Action Bar*: Floating action buttons ("Create Team", "Join Team").

#### 2. Team Control Panel (`/dashboard/teams/[id]` -> `src/app/(participant)/dashboard/teams/[id]/page.tsx`)
- **Invites Console**: Email input field with invitation SWR query. Displays status updates (Pending, Accepted, Rejected).
- **Roster Management**: Member rows featuring student verification statuses. Includes a "Transfer Leadership" action button for the leader.

#### 3. Proposal Submission Panel (`/dashboard/submissions/[id]` -> `src/app/(participant)/dashboard/submissions/[id]/page.tsx`)
- Simple validation-locked form.
- Inputs: Project Title, Proposal Doc URL (Google Docs link only, validated via regex).
- States: Displays "Locked" if submission date is exceeded, unless overridden by admin.

#### 4. bKash/Nagad Payment Desk (`/dashboard/payments/[id]` -> `src/app/(participant)/dashboard/payments/[id]/page.tsx`)
- **Step Instructions**: Outlines Bkash/Nagad Merchant Numbers, fee amounts, and references.
- **Proof Form**: Form fields for Transaction ID, drag-and-drop screenshot uploader, and status checker (Pending, Approved, Rejected, Resubmission Allowed).

---

### ROUTE GROUP D: `(admin)` — Platform Operations (Stripe-Style Desktop First)

#### 1. Command Center Home (`/admin` -> `src/app/(admin)/admin/page.tsx`)
- Collapsible operations sidebar, Ctrl+K global search popup.
- **Operational Metrics**:
  - Total registrations, profiles verified, selection rates, payment logs.
  - Revenue summary: Total expected revenue vs collected amount, represented in a circular gauge or clean progress bar.
- **Live Activity Feed**: Staggered log feed showing updates (New signups, payment uploads, submissions) in real-time.

#### 2. Verification Queue (`/admin/participants` -> `src/app/(admin)/admin/participants/page.tsx`)
- Data table listing profiles with status filter ("Pending Verification").
- **Verification modal**: Split screen showing Student ID images side-by-side with profile text. Buttons: "Approve Student", "Reject Student" (with custom reason text input).

#### 3. Competition Builder (`/admin/competitions` -> `src/app/(admin)/admin/competitions/page.tsx`)
- Form to edit description, upload banners, select eligibility (Internal/External), set min/max team limits, rules, and timelines.

#### 4. Submissions & Grading Portal (`/admin/submissions` -> `src/app/(admin)/admin/submissions/page.tsx`)
- Grid displaying team proposals. Clicking a team opens the grading panel.
- **Grading Panel**: Display active criteria fields with weights (e.g. Innovation /30, Tech Feasibility /25, Impact /20) and a live calculating final score.

#### 5. Payments verification Panel (`/admin/payments` -> `src/app/(admin)/admin/payments/page.tsx`)
- Grid displaying screenshot files, Transaction IDs, and corresponding team registrations. Includes quick action buttons: "Verify Payment", "Reject (Request Resubmission)".

#### 6. Google Sheets Sync Station (`/admin/sync` -> `src/app/(admin)/admin/sync/page.tsx`)
- Direct SWR action panel showing connection settings. Button triggers: "Sync Data to Sheets" (pushes participants, teams, submissions, and payments).

---

## 3. Database Schema & API Routes (ARCHITECTURE.md Alignment)

Verify that all queries use the Supabase client and route handlers follow these business constraints:

1. **Profile Verification Constraint**: Users are blocked from joining or creating teams until their Student ID is manually approved (`status = 'verified'`).
2. **Team Limits**: System checks `min_members` and `max_members` from the `competitions` table before allowing team submissions.
3. **Double Registration Guard**: Ensures a user cannot belong to multiple teams in the same competition.
4. **Timelines Validation**: Server validates timestamps for `registration_end` and `submission_end` on mutations.
5. **Admin Role Validation**: Every `/api/admin/*` route must check user metadata role on the server:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (user?.user_metadata?.role !== 'admin') return unauthorized();
   ```

---

## 4. UI/UX Completeness Requirements (RULES.md Alignment)

Every page generated by Google Stitch must include four mandatory states:

1. **Loading State**: Render tailored Tailwind skeleton loaders matching the layout structure (never a simple spinner).
2. **Success State**: Clear micro-interactions, success toasts (desktop: top-right, mobile: bottom), and status changes.
3. **Empty State**: Used whenever list arrays are empty. Must contain a visual illustration, explanation, and an action CTA button.
4. **Error State**: Displays clear, actionable instructions explaining the cause (e.g. "Google Docs link must be shareable and public. Please check your document access permissions").

---

## 5. Animation Spec (Framer Motion)
- **Hover States**: Apply CSS-only transitions (`duration-250 ease-out`).
  - Cards: `hover:scale-[1.02] hover:shadow-level-3`
  - Interactive item glow: rotate conic-gradients, subtle blur reveals.
- **Page Transitions**: Wrap routes in `AnimatePresence` with custom duration (max 500ms).
