# CSE Fest 2026 — Page Specifications & Feature Catalog

This document details every page in the application, categorized by route groups. It describes the page layout, user features, theme-aware behaviors, and underlying database queries or APIs.

---

## 1. Route Group: `(public)` — Public Landing & Directory

### Landing Page (Home)
- **Route Path**: `/` -> `src/app/(public)/page.tsx`
- **Layout**: Full-width editorial layout with sticky glassmorphic navigation header and a custom news ticker (`NewsTicker`).
- **Core Features**:
  - **Dynamic News Ticker**: Auto-scrolling ticker below the navbar. Pauses on mouse hover. Displays announcements with priority styling.
  - **Hero Section**: 100vh split layout.
    - *Left Column*: Eyebrow indicator, giant "CSE FEST 2026" title, horizontal countdown timer, core statistics block, and main CTAs.
    - *Right Column (Cyber Console)*: Interactive tabbed developer console widget with Overview (competition catalog), Live CLI Terminal (staggered mock terminal logs showing active validations), and Scoreboard Leaderboard.
  - **About Section**: Detailed columns highlighting department organizers, university statistics, and prize pool summaries.
  - **Virtual Campus Map**: Dynamic SVG map overlay showing SMUCT labs, halls, and rooms. Hovering elements outlines locations.
  - **FAQ Section**: Collapsible, smooth-animating glassmorphic accordion cards.
  - **Contact Block**: Form linked to the support submission table.
- **Theme Adaptability**:
  - *Light Mode*: Light base background (`var(--neutral-950)`), high-contrast text (`var(--neutral-200)`), and soft primary/secondary glows (opacity 0.03 - 0.08) overlaying a light gray tech grid.
  - *Dark Mode*: Deep dark slate base background (`var(--neutral-950)`), high-contrast white text (`var(--neutral-50)`), and glowing violet/indigo/cyan mesh.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/public/cms/ticker` -> Populates updates ticker.
  - `GET /api/public/cms/faqs` -> Populates FAQ accordion.
  - `POST /api/public/contact` -> Submits support form.

---

### Competitions Directory
- **Route Path**: `/competitions` -> `src/app/(public)/competitions/page.tsx`
- **Layout**: Center-constrained container with category filter rows and responsive 3-column card grid.
- **Core Features**:
  - **Category Filter Tabs**: Toggles listings between showcase events (External) and internal SMUCT-only contests.
  - **Search & Status Filtering**: Real-time text search with status pills (Open, Closed).
  - **Competition Cards**: Displays banner, name, team constraints, entry fee, prize pool, and quick view button.
- **Theme Adaptability**:
  - Light Mode: White card boxes with light gray borders (`border-neutral-850`).
  - Dark Mode: Dark card backgrounds (`var(--neutral-900)`) with subtle inline conic gradients.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/public/competitions` -> Retrieves all active competitions.

---

### Competition Details Page
- **Route Path**: `/competitions/[id]` -> `src/app/(public)/competitions/[id]/page.tsx`
- **Layout**: Asymmetric 2-column layout (70% Content Tabs, 30% Sticky Info Sidebar).
- **Core Features**:
  - **Hero Title Block**: Banner background, status badge, title, and "Register Your Team" main button.
  - **Content Tabs**:
    - *Overview*: Interactive rules list.
    - *Rules*: PDF rulebook download/embed viewport.
    - *Timeline*: Detailed date timeline.
    - *Prizes*: Visual breakdown of position rewards.
  - **Sticky Metadata Sidebar**: Summarizes entry fees, team size limits, deadlines, and eligibility criteria.
- **Theme Adaptability**: Tab selectors and sidebar items adapt high-contrast text sizes for readibility in light/dark modes.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/public/competitions/[id]` -> Retrieves details for specific ID.

---

### Finalists & Standings
- **Route Path**: `/finalists` -> `src/app/(public)/finalists/page.tsx`
- **Layout**: Data list grouped by competition, searchable by team or university name.
- **Core Features**:
  - **Team Leaderboard**: Shows verified finalist rosters and project names.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/public/finalists` -> Retrieves published selected finalists.

---

## 2. Route Group: `(auth)` — Authentication & Wizard Onboarding

### Sign In / Sign Up
- **Route Path**: `/login` & `/register` -> `src/app/(auth)/login/page.tsx`
- **Layout**: 60/40 Split Layout.
  - *Left (60%)*: Visual tech design mesh showcasing branding and highlights.
  - *Right (40%)*: Standard forms with OAuth buttons.
- **Core Features**:
  - **Google OAuth**: One-click Google sign-in.
  - **Email Auth**: Secure email login/registration with strict password strength validation.
- **Data Mappings (Supabase)**:
  - `supabase.auth.signInWithOAuth()`
  - `supabase.auth.signInWithPassword()` / `signUp()`

---

### Profile Wizard Setup
- **Route Path**: `/profile-wizard` -> `src/app/(auth)/profile-wizard/page.tsx`
- **Layout**: Focused single-column multi-step wizard card with a top status progress line.
- **Core Features**:
  - **Step 1: Personal Details**: Captures name, email, verified phone, gender.
  - **Step 2: Academic Profile**: University select dropdown, Student ID number, semester, and department.
  - **Step 3: Verification Documents**: Drag-and-drop file uploaders for Student ID card (Front and Back). Progress bar and image thumbnail preview.
  - **Step 4: Professional Links**: Captures bio, portfolio site, GitHub URL, and custom skill tags.
  - **Step 5: Review**: Overview summary before submission.
- **Data Mappings (Supabase)**:
  - `POST /api/participant/profile` -> Updates profile table.
  - `Supabase Storage` / `Cloudinary API` -> ID image uploads.

---

## 3. Route Group: `(participant)` — User Workspace (Mobile-First Focus)

### Dashboard Home
- **Route Path**: `/dashboard` -> `src/app/(participant)/dashboard/page.tsx`
- **Layout**: Responsive grid. Desktop uses collapsible sidebar; mobile uses fixed bottom navigation bar.
- **Core Features**:
  - **Verification Banner**: Shows status (Action Required, Pending, Verified).
  - **Teams Overview**: List of current teams, invites, and registration status.
  - **Upcoming Deadlines Widget**: Linear timeline of submission dates.
  - **Notifications Timeline**: Logs user events.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/participant/dashboard` -> Fetches teams, profile verification status, and announcements.

---

### Team Management Page
- **Route Path**: `/dashboard/teams/[id]` -> `src/app/(participant)/dashboard/teams/[id]/page.tsx`
- **Layout**: Cards grid for members, simple table for pending invites.
- **Core Features**:
  - **Invite Members**: Email input field. Validates user account existence before sending invite.
  - **Roster Management**: Row list of team members with individual verification indicators.
  - **Actions Panel**: "Accept/Reject Invitation", "Transfer Leadership", and "Leave Team".
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/participant/teams/[id]` -> Retrieves team roster.
  - `POST /api/participant/teams/invite` -> Creates invitation entry.
  - `POST /api/participant/teams/transfer` -> Updates leader ID.

---

### Proposal Submission Page
- **Route Path**: `/dashboard/submissions/[id]` -> `src/app/(participant)/dashboard/submissions/[id]/page.tsx`
- **Layout**: Clean, focused form card.
- **Core Features**:
  - **Submission Form**: Inputs for Project Title, Description, and Google Docs Proposal link.
  - **Submission Lock Check**: Checks database timeline; disables form automatically if deadline is passed.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/participant/submissions/[id]` -> Retrieves existing submission draft.
  - `POST /api/participant/submissions` -> Saves/Submits proposal.

---

### Bkash / Nagad Payment Page
- **Route Path**: `/dashboard/payments/[id]` -> `src/app/(participant)/dashboard/payments/[id]/page.tsx`
- **Layout**: Multi-step payment form.
- **Core Features**:
  - **Instruction Box**: Merchant details, account codes, and exact fee structure.
  - **Verification Form**: Transaction ID validation input and payment screenshot drag-and-drop file uploader.
- **Data Mappings (SWR/Supabase)**:
  - `POST /api/participant/payments` -> Submits screenshot and Transaction ID.

---

## 4. Route Group: `(admin)` — Platform Operations (Stripe-Style Desktop)

### Admin Home (Analytics)
- **Route Path**: `/admin` -> `src/app/(admin)/admin/page.tsx`
- **Layout**: Desktop-first layout with Ctrl+K global search popup.
- **Core Features**:
  - **KPI Cards**: Summary figures for Participants, Teams, Revenue, and expected collection rates.
  - **Revenue Circular Gauges**: expected vs collected visualizer.
  - **Dynamic Activity Log**: Real-time chronological action log.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/admin/analytics` -> Retrieves metrics from DB.

---

### Participant Verification
- **Route Path**: `/admin/participants` -> `src/app/(admin)/admin/participants/page.tsx`
- **Layout**: Paginated datatable with filters.
- **Core Features**:
  - **Preview Modal**: Double-frame preview displaying ID card front and back.
  - **Actions**: Quick approve/reject (triggers in-app notifications).
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/admin/participants/pending` -> List of pending verification profiles.
  - `POST /api/admin/participants/verify` -> Sets status to verified/rejected.

---

### Competition Builder
- **Route Path**: `/admin/competitions` -> `src/app/(admin)/admin/competitions/page.tsx`
- **Layout**: List table + Form builder drawer.
- **Core Features**:
  - **Builder Form**: Edit details, eligibility limits, team parameters, timelines, and PDF uploads.
- **Data Mappings (SWR/Supabase)**:
  - `POST /api/admin/competitions` -> Save/Update competition parameters.

---

### Submissions & Grading Portal
- **Route Path**: `/admin/submissions` -> `src/app/(admin)/admin/submissions/page.tsx`
- **Layout**: Table view + Split-pane grading overlay.
- **Core Features**:
  - **Grading Matrix**: Renders custom criteria fields based on selected competition rules. Automatically computes final scores and updates leaderboard positions.
- **Data Mappings (SWR/Supabase)**:
  - `GET /api/admin/submissions` -> Fetches teams and proposals.
  - `POST /api/admin/submissions/grade` -> Adds scores.

---

### Payment Verification Panel
- **Route Path**: `/admin/payments` -> `src/app/(admin)/admin/payments/page.tsx`
- **Layout**: Audit layout.
- **Core Features**:
  - **Quick Verify**: Compares screenshot and Transaction ID to set status.
- **Data Mappings (SWR/Supabase)**:
  - `POST /api/admin/payments/verify` -> Approve/Reject transaction status.

---

### Google Sheets Sync Station
- **Route Path**: `/admin/sync` -> `src/app/(admin)/admin/sync/page.tsx`
- **Layout**: Simple dashboard panel.
- **Core Features**:
  - **Sync controls**: Select tables to map and push (Participants, Teams, Payments). Displays last sync timestamp.
- **Data Mappings (SWR/Supabase)**:
  - `POST /api/admin/sheets/sync` -> Triggers integration sync.
