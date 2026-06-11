# AGENTS.md — Multi-Agent Instructions for CSE Fest 2026

> This file governs how all AI agents (Antigravity/Claude, Gemini CLI, and any subagents) operate on this project.  
> Every agent reads this file before taking any action.

---

## Project Identity

**Project:** CSE Fest 2026 Management Platform  
**Organization:** CSE + CSIT, Shanto-Mariam University of Creative Technology (SMUCT)  
**Event:** July 18, 2026  
**Type:** Full-stack festival management platform

---

## Golden Context Files — Read These First

Before writing any code, every agent must internalize these files in order:

| Priority | File | Purpose |
|----------|------|---------|
| 1 | [PROJECT.md](./PROJECT.md) | What the platform is, who uses it, competition structure |
| 2 | [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, database schema, API structure, business rules |
| 3 | [DESIGN.md](./DESIGN.md) | Design system, tokens, components, animation rules |
| 4 | [WORKFLOWS.md](./WORKFLOWS.md) | State machines and step-by-step feature flows |
| 5 | [PHASES.md](./PHASES.md) | Three-phase roadmap with deliverable checklists |
| 6 | [RULES.md](./RULES.md) | Strict coding rules — non-negotiable |

---

## Agent Behavioral Rules

### Core Mandates

1. **Read before writing.** Always check existing code before creating new files. Do not duplicate utilities, hooks, or components that already exist.

2. **Follow the design system.** DESIGN.md is the law. No arbitrary colors, no arbitrary spacing, no default Tailwind colors. Use design tokens exclusively.

3. **Follow the workflows.** WORKFLOWS.md defines the exact state machines. Do not invent alternative flows. If a workflow is ambiguous, surface the ambiguity — do not assume.

4. **Follow the rules.** RULES.md defines zero-tolerance violations. If a rule would be broken, stop and explain why before proceeding.

5. **Implement all states.** Every feature must include: loading state, empty state, error state, and success state. Shipping without these is incomplete.

6. **No placeholders.** Do not write `// TODO: implement later`, placeholder components, or lorem ipsum. Implement the real thing or surface the blocker.

7. **No AI slop.** No generic dashboard templates, default chart colors, copy-pasted code blocks, or vague error messages. Every output must be intentional.

---

## Stack Context (Quick Reference)

```
Framework:     Next.js (App Router)
Styling:       Tailwind CSS v4 (token-driven)
Components:    shadcn/ui (heavily customized)
Animation:     Framer Motion
Charts:        Recharts (custom styled)
Tables:        TanStack Table v8
Icons:         Lucide React (exclusively)
Database:      Supabase (PostgreSQL + RLS)
Auth:          Supabase Auth (email + Google OAuth)
Storage:       Cloudinary
Forms:         react-hook-form + zod
Server state:  SWR or React Query
```

---

## Agent Task Protocol

When given a task, follow this sequence:

1. **Identify the phase** — is this Phase 1, 2, or 3 work? Check PHASES.md.
2. **Identify the workflow** — does WORKFLOWS.md describe this feature's state machine?
3. **Check existing code** — does a relevant component, hook, or utility already exist?
4. **Check design tokens** — which tokens from DESIGN.md apply?
5. **Check business rules** — are there rules in ARCHITECTURE.md that constrain this?
6. **Check RULES.md** — will any zero-tolerance rules be triggered?
7. **Implement** — build the complete feature including all states (loading, empty, error).
8. **Verify** — run TypeScript checks, ESLint, and test all paths before marking done.

---

## When Working on UI Components

- Fonts in use: Space Grotesk (headings), Inter (body), Geist Mono (numbers)
- Lucide icons exclusively — no heroicons, no react-icons, no feather
- Cards hover: `scale(1.02)` + shadow increase (duration: 250ms)
- Page transitions: fade/slide/blur, max 500ms
- Glassmorphism: navbar, ticker, modals, hero elements, stats cards ONLY
- Admin dashboard must feel: Stripe + Linear + Vercel
- Participant dashboard: simpler, mobile-first, focus on teams/competitions/deadlines

---

## When Working on API Routes

Every API route must:
1. Validate request body (Zod schema)
2. Authenticate user (Supabase session)
3. Authorize role (participant vs admin checks)
4. Return structured: `{ success: boolean, data?: T, message?: string }`
5. Use correct HTTP status codes

---

## When Working on Database

- All queries go through Supabase client
- RLS policies must be active — never bypass with service role in client code
- Always index foreign keys
- Multi-table mutations use transactions
- Never use string concatenation in queries

---

## Feature Completeness Standard

A feature is **not done** until it has:

- [ ] Working happy path
- [ ] Skeleton loader (not spinner) on data fetch
- [ ] Empty state (illustration + message + CTA button)
- [ ] Error state (specific message, not "Something went wrong")
- [ ] Mobile-responsive layout (test at 375px)
- [ ] Keyboard navigable
- [ ] TypeScript types (no `any`)
- [ ] Zod validation on form/API inputs
- [ ] Correct status code and response shape from API

---

## Communication Rules for Agents

- If a requirement is ambiguous, **ask before building** — do not assume
- If a task would violate RULES.md, **surface the conflict** — do not silently work around it
- If existing code conflicts with the spec, **flag it** — do not patch it silently
- Report blocking issues immediately, not after wasted implementation effort

---

## Installed Skills Available

The following skills are available to agents via the Antigravity skill system.  
Use the most specific skill for the task. Do not use generic approaches when a specialized skill exists.

### Frontend & UI
- `frontend-design` — opinionated frontend designer-engineer patterns
- `react-patterns` — modern React hooks, composition, performance
- `nextjs-best-practices` — App Router patterns, data fetching, routing
- `tailwind-patterns` — Tailwind CSS v4, CSS-first configuration, design tokens
- `shadcn` — shadcn/ui component context, documentation, usage patterns
- `animejs-animation` — complex web animations (use for public site hero)
- `design-spells` — micro-interactions that add "magic" (hover effects, transitions)
- `ui-skills` — opinionated constraints for building interfaces
- `zustand-store-ts` — Zustand stores with proper TypeScript types
- `tanstack-query-expert` — React Query / SWR patterns

### Backend & Database
- `nextjs-best-practices` — API routes, server components
- `database-design` — schema design, indexing strategy, ORM selection
- `neon-postgres` — Postgres connection patterns (adapt for Supabase)
- `nextjs-supabase-auth` — Supabase Auth with Next.js App Router (critical for this project)
- `zod-validation-expert` — Zod schema patterns for forms and API validation
- `api-patterns` — API design, response formats, versioning

### Code Quality
- `code-reviewer` — AI-powered code review
- `systematic-debugging` — structured debugging approach
- `tdd-workflow` — test-driven development
- `simplify-code` — clarity review, safe simplifications
- `vibe-code-auditor` — audit for structural flaws and fragility

### Design System
- `design-md` — synthesize a semantic design system into DESIGN.md files
- `frontend-slides` — presentation generation if needed
- `iconsax-library` — icon guidance (though project uses Lucide only)

### DevOps & Production
- `vercel-deployment` — deploying Next.js to Vercel
- `security-auditor` — security audit across layers
- `web-performance-optimization` — Lighthouse score improvements

---

## Subagent Spawning Guidelines

When a task can be parallelized:
- Spawn separate agents for: public website components, participant dashboard, admin dashboard
- Do NOT spawn parallel agents that write to the same file
- Always synchronize on shared types and interfaces before parallel implementation
- The orchestrating agent is responsible for merging and validating outputs

---

## Final Quality Bar

The platform must feel like a **premium technology product** built by a professional team.

Users must think: *"This is professionally built."*  
Users must NOT think: *"This is another university registration website."*

If your output does not clear that bar, revise before submitting.
