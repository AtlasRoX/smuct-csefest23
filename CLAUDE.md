# CLAUDE.md — Antigravity (Claude) Instructions for CSE Fest 2026

> This file is read automatically by Antigravity / Claude at the start of every session in this workspace.  
> It establishes the full project context, behavioral rules, and skill usage guide.

---

## Project Context

**Project:** CSE Fest 2026 Management Platform  
**Stack:** Next.js (App Router) · Supabase · Tailwind CSS v4 · Framer Motion · shadcn/ui  
**Role:** Full-stack festival management + competition platform + admin control center  
**Event Date:** July 18, 2026  
**Organization:** CSE + CSIT, Shanto-Mariam University of Creative Technology (SMUCT)

---

## Mandatory Reading Order

Read these files before touching any code. They are the single source of truth.

```
PROJECT.md       → What the platform is, who uses it, competition structure
ARCHITECTURE.md  → Tech stack, database schema, API routes, business rules
DESIGN.md        → Design system: tokens, colors, typography, animation rules
WORKFLOWS.md     → State machines and feature flows (implement these exactly)
PHASES.md        → Three-phase roadmap with deliverable checklists
RULES.md         → Zero-tolerance coding rules (non-negotiable)
AGENTS.md        → Multi-agent orchestration and behavioral rules
```

---

## How to Behave in This Project

### Before Writing Any Code
1. Check if a component/hook/utility for this already exists in the codebase
2. Check DESIGN.md for the relevant design tokens
3. Check WORKFLOWS.md for the feature's state machine
4. Check RULES.md for rules that apply to what you're about to write

### While Writing Code
- TypeScript everywhere — no `any`, no untyped props
- Use design tokens — no hardcoded hex values, no arbitrary px values
- Follow the file structure from RULES.md
- Every async operation needs loading + empty + error states
- Use `react-hook-form` + `zod` for all forms
- Use SWR or React Query for all server state (not `useEffect` + `fetch`)

### Quality Standard
Every output must feel like it was written by a senior engineer at Stripe or Vercel.  
If it looks like a template was filled in, it's not good enough.

---

## Anti-Pattern List

These patterns are explicitly banned. If you're about to write one, stop and find the right approach.

| Banned Pattern | Correct Approach |
|----------------|-----------------|
| `const data: any` | Explicit TypeScript interface |
| `style={{ color: '#6366f1' }}` | CSS variable via design token |
| `className="bg-indigo-600"` | `className="bg-primary"` (token) |
| `// TODO: implement later` | Implement it now or file a blocker |
| Spinner as the only loading state | Skeleton loader |
| `"Something went wrong"` | Specific, actionable error message |
| `useEffect(() => { fetch(...) }, [])` | `useSWR(...)` or `useQuery(...)` |
| Business logic in JSX | Extract to hook or service function |
| `console.log('debug')` left in code | Remove before committing |
| Default shadcn/ui colors | Override with project design tokens |
| Default Recharts colors | Custom styled with brand colors |

---

## Skill Usage Guide

Use the most specific skill available. Here are the skills most relevant to this project:

### Critical Skills for This Project

**`nextjs-supabase-auth`**  
Use for any authentication flow, session management, protected routes, or Google OAuth integration.  
This is the most important backend skill for this project.

**`nextjs-best-practices`**  
Use for App Router patterns, server components, data fetching, route groups, middleware.  
The project uses Next.js App Router exclusively.

**`tailwind-patterns`**  
Use for Tailwind CSS v4 configuration, CSS-first design token setup, container queries.  
The project uses Tailwind v4 — not v3. Different config approach.

**`shadcn`**  
Use when adding or customizing shadcn/ui components.  
All shadcn components must be customized with project design tokens before use.

**`zod-validation-expert`**  
Use for every form schema and every API route input validation.  
Zod is mandatory — no forms without schemas.

**`react-patterns`**  
Use for hooks design, component composition, performance optimization.

**`database-design`**  
Use when designing new tables, relationships, or query patterns.  
Cross-reference with ARCHITECTURE.md schema first.

**`animejs-animation`**  
Use for complex hero animations on the public website (orbiting competition cards).  
For simpler transitions, Framer Motion is preferred.

**`design-spells`**  
Use for adding micro-interactions: card lifts, button hover effects, scroll reveals.  
Every interactive element needs a design spell.

**`systematic-debugging`**  
Use at the first sign of a bug. Do not guess — systematically diagnose.

**`vibe-code-auditor`**  
Use after completing a feature to audit for structural flaws before committing.

**`code-reviewer`**  
Use before any PR to get a thorough review of the diff.

**`vercel-deployment`**  
Use when deploying or troubleshooting the Vercel deployment.

**`security-auditor`**  
Use before shipping Phase 2 (payment system) and Phase 3 (production hardening).

**`web-performance-optimization`**  
Use when Lighthouse score needs improvement (target: 90+).

---

## Component Implementation Checklist

When building any UI component, verify:

- [ ] TypeScript interface defined for all props
- [ ] Design tokens used (not hardcoded values)
- [ ] Lucide icons (not any other library)
- [ ] Hover state implemented (CSS transition, 250ms)
- [ ] Loading state (skeleton, not spinner)
- [ ] Empty state (illustration + message + CTA)
- [ ] Error state (specific message)
- [ ] Mobile responsive (375px minimum)
- [ ] Keyboard accessible (tab order, focus ring)
- [ ] Framer Motion for complex animations
- [ ] `prefers-reduced-motion` respected

---

## API Route Implementation Checklist

When building any API route, verify:

- [ ] Zod schema validates the request body
- [ ] Auth check: `supabase.auth.getUser()` called first
- [ ] Role check: participant vs admin verified server-side
- [ ] Response format: `{ success: boolean, data?, message? }`
- [ ] Error responses use correct HTTP status codes
- [ ] Audit log entry created for admin mutations
- [ ] Rate limiting in place for auth and submission endpoints

---

## Page Routes Reference

```
/ — Public homepage
/competitions — Competition listing
/competitions/[slug] — Competition detail
/login — Login page
/register — Registration page
/auth/callback — OAuth callback

/dashboard — Participant dashboard home
/dashboard/profile — Profile management
/dashboard/teams — My teams
/dashboard/competitions — My competitions
/dashboard/notifications — Notification center
/dashboard/payments — Payment history

/admin — Admin dashboard overview
/admin/competitions — Competition management
/admin/participants — Participant management
/admin/teams — Team management
/admin/submissions — Submission review
/admin/payments — Payment verification
/admin/judging — Judging + scoring
/admin/analytics — Analytics platform
/admin/announcements — CMS: announcements
/admin/ticker — CMS: news ticker
/admin/faq — CMS: FAQ management
/admin/settings — Contact + platform settings
/admin/sheets — Google Sheets sync
/admin/audit — Audit logs
```

---

## Competition State Flow (Quick Reference)

```
External:  Register → Submit Proposal → Selected → Pay → Finalist
Internal:  Register → Pay → Confirmed Participant
```

```
Submission: Draft → Submitted → Under Review → Selected | Rejected
Payment:    Pending → Approved | Rejected | Resubmission Required
Verification: Incomplete → Pending → Verified
```

---

## Session-Specific Instructions

When starting a new session in this workspace:

1. Read PROJECT.md first to re-establish context
2. Check PHASES.md to identify which phase is currently active
3. Check what was last worked on (git status or open files)
4. Never start writing without knowing: which phase, which feature, which state machine

---

## Important Reminders

- **The platform must feel premium.** If it looks like a university portal, it's failed.
- **Mobile first.** Test at 375px. The participant experience is mobile-primary.
- **No placeholder content.** Use `generate_image` tool for real placeholder images.
- **Design tokens always.** Design.md is law.
- **State machines are law.** Workflows.md is law. Do not improvise flows.
- **Rules.md is non-negotiable.** Zero tolerance rules are zero tolerance.
