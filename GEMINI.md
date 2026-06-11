# GEMINI.md — Gemini CLI Instructions for CSE Fest 2026

> This file is read automatically by the Gemini CLI agent at session start.  
> It establishes the full project context, operational rules, and skill usage guide.

---

## Project Context

**Project:** CSE Fest 2026 Management Platform  
**Stack:** Next.js (App Router) · Supabase · Tailwind CSS v4 · Framer Motion · shadcn/ui  
**Role:** Full-stack festival management + competition platform + admin control center  
**Event Date:** July 18, 2026  
**Organization:** CSE + CSIT, Shanto-Mariam University of Creative Technology (SMUCT)

---

## Mandatory Reading Order

Read these files before executing any task. Do not skip. They are the single source of truth.

```
PROJECT.md       → What the platform is, competition structure, user roles
ARCHITECTURE.md  → Tech stack, DB schema, API routes, RLS policies, business rules
DESIGN.md        → Full design system: tokens, typography, animation, components
WORKFLOWS.md     → Exact state machines and feature flows — implement literally
PHASES.md        → Three-phase roadmap — check which phase is currently active
RULES.md         → Zero-tolerance coding rules — every rule is non-negotiable
AGENTS.md        → Multi-agent orchestration protocol
```

---

## Gemini CLI Operational Rules

### Before Any Code Action
1. `cat PROJECT.md` — understand what you're building
2. `cat ARCHITECTURE.md` — know the stack and constraints
3. Check if relevant code exists: `grep -r "ComponentName" src/`
4. Check relevant design tokens: `cat DESIGN.md`
5. Check the feature's state machine: `cat WORKFLOWS.md`
6. Check applicable coding rules: `cat RULES.md`

### During Implementation
- TypeScript strict mode — no `any`, explicit types everywhere
- Design tokens only — no hardcoded hex, no arbitrary px
- Lucide icons exclusively — check with `import { ... } from 'lucide-react'`
- `react-hook-form` + `zod` for all forms
- SWR or React Query for all server state
- Framer Motion for component animations, CSS transitions for hover states

### Running Checks
After writing any code, run:
```bash
npx tsc --noEmit        # TypeScript check
npx eslint src/         # ESLint check
npm run build           # Build verification (before PR)
```

---

## Skill Usage Guide for Gemini CLI

The following skills are installed in the Gemini CLI skill system.  
Invoke the most specific skill available for each task.

### Authentication & Backend

**`nextjs-supabase-auth`**
- Invoke for: Supabase Auth setup, session handling, protected routes, Google OAuth, middleware
- Critical skill — use every time auth is involved
- Pattern: Server-side session with `createServerClient`, client-side with `createBrowserClient`

**`nextjs-best-practices`**
- Invoke for: App Router patterns, Server vs Client components, data fetching strategy, route groups
- Key patterns: `(auth)`, `(participant)`, `(admin)` route groups, `layout.tsx` nesting

**`database-design`**
- Invoke for: New table design, relationship modeling, query optimization
- Always cross-reference with ARCHITECTURE.md schema first

**`neon-postgres`** (adapt patterns for Supabase)
- Invoke for: Query optimization, connection pooling patterns
- Note: This project uses Supabase, not Neon — adapt patterns accordingly

**`api-patterns`**
- Invoke for: REST API design, response format, error handling patterns
- All routes must return: `{ success: boolean, data?: T, message?: string }`

### Frontend & Styling

**`tailwind-patterns`**
- Invoke for: Tailwind CSS v4 config, CSS-first configuration, design token setup
- Critical: This project uses **v4** — the config approach differs from v3
- CSS-first: tokens defined in CSS, not `tailwind.config.js`

**`shadcn`**
- Invoke for: Adding shadcn/ui components, understanding component APIs
- All components must be customized with project tokens before use

**`react-patterns`**
- Invoke for: Hook patterns, component composition, performance optimization
- Key: Custom hooks for data fetching, co-locate state with its consumer

**`zustand-store-ts`**
- Invoke for: Global UI state management
- Only use Zustand if state is genuinely global — confirm necessity first

**`tanstack-query-expert`**
- Invoke for: Complex data fetching, caching, optimistic updates
- Preferred over SWR for admin data tables with mutations

### Animation & Design

**`animejs-animation`**
- Invoke for: Complex public website hero animations (orbiting competition cards)
- Use Anime.js for timeline-based complex sequences

**`design-spells`**
- Invoke for: Micro-interactions, hover effects, scroll reveals, card lifts
- Apply to: every card, every button, every interactive element

**`frontend-design`**
- Invoke for: Layout decisions, visual hierarchy, overall UX direction
- Reference: premium products (Stripe, Linear, Vercel) — not university portals

### Code Quality & Security

**`zod-validation-expert`**
- Invoke for: Form schemas, API request validation, type inference from schemas
- Every form and every API route requires a Zod schema

**`systematic-debugging`**
- Invoke at: First sign of a bug — systematically diagnose before fixing
- Never guess — read the error, trace the path, form a hypothesis

**`vibe-code-auditor`**
- Invoke before: Committing any significant feature
- Audits for: structural flaws, fragility, production risks

**`code-reviewer`**
- Invoke before: Any PR or merge
- Reviews: security, performance, correctness, style compliance

**`security-auditor`**
- Invoke before: Phase 2 ship (payment system), Phase 3 ship (production)
- Covers: auth bypass, SQL injection, file upload vulnerabilities, RLS gaps

### Performance & Deployment

**`web-performance-optimization`**
- Invoke when: Lighthouse score below 90
- Covers: code splitting, image optimization, lazy loading, caching

**`vercel-deployment`**
- Invoke for: Deployment configuration, environment variables, edge functions
- Project deploys to Vercel — use appropriate Next.js Vercel optimizations

### Data & Analytics

**`claude-d3js-skill`**
- Invoke for: Complex custom chart implementations on the analytics dashboard
- Note: Recharts is the primary chart library — use D3 only for highly custom visualizations

**`analytics-tracking`**
- Invoke for: Setting up analytics event tracking on user actions

---

## PowerShell-Specific Notes (Windows Environment)

The user's OS is Windows with PowerShell. Respect these patterns:

```powershell
# Path separator: backslash in PowerShell, forward slash in Node
# Use forward slashes in code, backslashes only in shell commands

# Run dev server
npm run dev

# TypeScript check
npx tsc --noEmit

# Install package
npm install package-name

# Run a script
npx script-name

# List directory
Get-ChildItem -Path .\src\ -Recurse

# Find in files (PowerShell equivalent of grep)
Select-String -Path ".\src\**\*.tsx" -Pattern "ComponentName"
```

Reference skill: **`powershell-windows`** for Windows-specific shell patterns.

---

## File Structure for Gemini to Navigate

```
final box/
├── PROJECT.md          ← Read first
├── ARCHITECTURE.md     ← Read second
├── DESIGN.md           ← Read third
├── WORKFLOWS.md        ← Read fourth
├── PHASES.md           ← Read fifth
├── RULES.md            ← Read sixth
├── AGENTS.md           ← Agent protocol
├── CLAUDE.md           ← Antigravity instructions
├── GEMINI.md           ← This file
├── DOC/                ← Source documentation (read-only reference)
│   ├── prd.md          ← Full PRD (all 3 phases)
│   ├── projeject-brief.md ← Project brief
│   ├── designspect.md  ← Design specification
│   └── ui-ux.md        ← UI/UX specification
└── [project code]      ← Implementation (Next.js project)
```

---

## Task Execution Protocol

When given any task:

```
1. Identify the phase: PHASES.md → is this Phase 1, 2, or 3?
2. Find the workflow: WORKFLOWS.md → what is the exact state machine?
3. Check existing code: does this already exist? (grep/list)
4. Get design tokens: DESIGN.md → which tokens apply?
5. Check business rules: ARCHITECTURE.md → what constraints exist?
6. Check coding rules: RULES.md → what must be avoided?
7. Implement: complete feature with all states (loading, empty, error, success)
8. Verify: TypeScript, ESLint, responsive at 375px, keyboard accessible
9. Review: run vibe-code-auditor mentally before completing
```

---

## Feature Completeness Gate

A feature is NOT complete until all boxes are checked:

```
□ Happy path works correctly
□ Loading state: skeleton loader (never spinner-only)
□ Empty state: illustration + message + action button
□ Error state: specific actionable message (not "Something went wrong")
□ Mobile layout: tested at 375px minimum width
□ Keyboard: tab-navigable, visible focus rings
□ TypeScript: no `any` types, all props typed
□ Validation: Zod schema on form and API route
□ API: auth + role check + structured response + correct status code
□ Admin mutations: audit log entry created
```

---

## Competition & Status Reference (Quick Access)

### Competition Types
- External: Software Showcase, IoT Showcase, Idea Showcase
- Internal: Competitive Programming, Datathon, CTF, Robo Soccer, LFR, Valorant, FIFA

### Status Enums
```typescript
type VerificationStatus  = 'incomplete' | 'pending' | 'verified'
type SubmissionStatus    = 'draft' | 'submitted' | 'under_review' | 'selected' | 'rejected'
type PaymentStatus       = 'pending' | 'approved' | 'rejected' | 'resubmission_required'
type CompetitionStatus   = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'archived'
type TeamStatus          = 'forming' | 'registered' | 'submitted' | 'selected' | 'rejected' | 'finalist'
```

---

## Critical Business Rules (Enforce These in Code)

1. Unverified users → cannot register for competitions
2. Team size → must be within competition `min_members` / `max_members`
3. Submissions → lock after `submission_end` (admin can override)
4. One team per user per competition
5. Rankings → only public if admin explicitly publishes
6. Admin role → verified server-side on every protected request
7. File uploads → type + size validated server-side (not just client)

---

## Quality Standard

The final platform must feel like it was built by a professional team for a premium product.

**Target feeling:** "This is professionally built."  
**Failure feeling:** "This is another university registration website."

If your output doesn't clear the bar, revise before finishing.
