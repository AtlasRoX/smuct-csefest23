# CSE Fest 2026 — Coding Rules

> These rules are non-negotiable. Every agent and developer working on this project must follow them.  
> Breaking these rules is grounds for a full code review and revert.

---

## Zero Tolerance Rules

These are absolute. No exceptions. No debate.

1. **No `any` types in TypeScript** — use explicit types or `unknown` with guards
2. **No `console.log` in committed code** — use a logger utility
3. **No hardcoded strings** — use constants files or i18n keys
4. **No hardcoded colors** — use CSS variables / design tokens only
5. **No magic numbers** — name every numeric constant
6. **No inline styles** — use Tailwind classes or CSS modules
7. **No default Tailwind colors** (`red-500`, `blue-600`) — use the project's HSL token palette
8. **No mixing of icon libraries** — Lucide only
9. **No `!important` in CSS** — fix the specificity properly
10. **No direct DOM manipulation** — use React state and refs correctly

---

## Anti-AI-Slop Rules

These specifically prevent common AI-generated code patterns that look plausible but are poor quality:

### Do Not Generate
- Placeholder components (`// TODO: implement later`)
- Generic error messages (`"Something went wrong"`)
- Commented-out blocks of code left in the file
- Duplicate utility functions (check if one already exists)
- Functions longer than 50 lines without decomposition
- Components with more than 200 lines without splitting
- `useEffect` with empty dependency arrays as an escape hatch
- Fetching data directly in components instead of custom hooks
- Business logic inside JSX / render functions
- Copy-pasted code blocks — extract to shared utilities

### Do Not Use
- Generic Bootstrap or Tailwind templates as starting points
- Default chart colors from Recharts
- Default shadcn/ui themes without project token overrides
- Placeholder text like "Lorem ipsum" or "Example Company"
- Generic avatar/image placeholders — generate real ones with the `generate_image` tool

---

## File Structure Rules

```
src/
  app/                  — Next.js App Router pages
    (public)/           — Public-facing pages (no auth)
    (auth)/             — Auth pages (login, register)
    (participant)/      — Participant dashboard
    (admin)/            — Admin dashboard
    api/                — API routes
  components/
    ui/                 — Base components (buttons, inputs, cards)
    shared/             — Shared cross-domain components
    public/             — Public website components
    participant/        — Participant dashboard components
    admin/              — Admin dashboard components
  hooks/                — Custom React hooks (all data fetching here)
  lib/                  — Utilities, helpers, constants
  types/                — TypeScript interfaces and types
  styles/               — Global CSS, design tokens
  constants/            — Named constants only (no magic numbers)
```

### Rules
- One component per file
- Component file name = component name (PascalCase)
- Hook files start with `use` prefix
- All exports are named exports (no default exports except page.tsx files)
- Co-locate tests with the component they test

---

## TypeScript Rules

```typescript
// CORRECT: explicit type
interface Competition {
  id: string
  name: string
  status: CompetitionStatus
}

// WRONG: any type
const data: any = await fetch(...)

// CORRECT: unknown with guard
const data: unknown = await fetch(...)
if (isCompetition(data)) { ... }

// CORRECT: const enum for status types
type VerificationStatus = 'incomplete' | 'pending' | 'verified'
type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'selected' | 'rejected'
type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'resubmission_required'
type CompetitionStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'archived'
```

---

## Component Rules

```tsx
// CORRECT: clean, typed, separated concerns
interface CompetitionCardProps {
  competition: Competition
  onRegister: (id: string) => void
}

export function CompetitionCard({ competition, onRegister }: CompetitionCardProps) {
  // No business logic here — only render logic
  return (
    <div className="rounded-xl bg-surface-2 p-6 hover:shadow-level-2 transition-all duration-normal">
      ...
    </div>
  )
}

// WRONG: no types, business logic in component, inline styles
export default function Card({ data }) {
  const handleClick = async () => {
    const res = await fetch('/api/register', { ... })
    // business logic here
  }
  return <div style={{ padding: '20px', background: '#1a1a2e' }}>...</div>
}
```

---

## Data Fetching Rules

```typescript
// CORRECT: custom hook
function useCompetitions() {
  const { data, error, isLoading } = useSWR('/api/competitions', fetcher)
  return { competitions: data, error, isLoading }
}

// WRONG: direct fetch in component
function CompetitionList() {
  useEffect(() => {
    fetch('/api/competitions').then(...)  // NEVER do this
  }, [])
}
```

---

## Form Rules

- Use `react-hook-form` with `zod` validation for every form
- Define the schema first, derive the type from the schema
- Show field-level error messages (not just form-level)
- Disable the submit button while submitting
- Show loading state on the submit button during submission

```typescript
// CORRECT
const competitionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  entryFee: z.number().min(0, 'Fee cannot be negative'),
})

type CompetitionFormData = z.infer<typeof competitionSchema>
```

---

## Error Handling Rules

```typescript
// CORRECT: specific, actionable error messages
throw new Error('Payment screenshot exceeds 5MB. Please upload a smaller image.')

// WRONG: generic
throw new Error('Upload failed')

// CORRECT: server responses include a message field
return NextResponse.json(
  { success: false, message: 'Team is already registered for this competition.' },
  { status: 409 }
)
```

---

## API Route Rules

Every API route must:
1. Validate the incoming request body with Zod before processing
2. Check authentication (`getServerSession` or `supabase.auth.getUser()`)
3. Check authorization (role check: is this user allowed to do this?)
4. Return structured responses: `{ success: boolean, data?: T, message?: string }`
5. Handle errors with appropriate HTTP status codes

```typescript
// CORRECT structure
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return badRequest(result.error)

  // business logic
  const data = await createTeam(result.data, session.user.id)
  return NextResponse.json({ success: true, data })
}
```

---

## Styling Rules

```css
/* CORRECT: design token */
.card {
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: var(--spacing-6); /* 24px */
  box-shadow: var(--shadow-1);
}

/* WRONG: arbitrary values */
.card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 22px;
}
```

```tsx
// CORRECT: Tailwind with project tokens
<div className="bg-surface-2 rounded-xl p-6 shadow-level-1">

// WRONG: default Tailwind colors
<div className="bg-gray-900 rounded-xl p-5">
```

---

## Animation Rules

- Always use Framer Motion for component animations
- Always use CSS `transition` for hover states (not JS)
- Never animate more than 3 properties simultaneously
- Use `will-change: transform` only when a real performance issue exists
- Respect `prefers-reduced-motion` media query

```tsx
// CORRECT: framer motion with reduced motion support
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
>
```

---

## State Management Rules

- **Server state:** SWR or React Query (never useState + useEffect for fetching)
- **Form state:** react-hook-form
- **UI state (local):** useState (co-located in the component that owns it)
- **Global UI state:** Zustand (only if truly global — confirm before adding)
- **No prop drilling** beyond 2 levels — lift state or use context/store

---

## Database Rules (Supabase)

- RLS policies must be tested before deploying
- Never bypass RLS with `service_role` key in client-side code
- Always use parameterized queries — never string concatenation for queries
- Index foreign keys and frequently filtered columns
- Use transactions for multi-table mutations

---

## Security Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Validate file type and size **server-side** (not just client-side)
- Rate-limit auth endpoints and submission endpoints
- Sanitize all user-generated content before storing
- Admin routes must verify role server-side on every request

---

## Commit Rules

- One feature/fix per commit
- Commit messages follow Conventional Commits:
  - `feat: add payment verification dashboard`
  - `fix: resolve team invitation email validation`
  - `refactor: extract scoring logic to lib/scoring.ts`
  - `chore: update dependencies`
- No commit with `WIP`, `temp`, `test123`, or similar
- No commit that disables TypeScript or ESLint checks

---

## Review Checklist Before Any PR

- [ ] All TypeScript errors resolved
- [ ] No `any` types introduced
- [ ] No `console.log` statements
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Mobile responsive (tested at 375px minimum)
- [ ] Keyboard navigable
- [ ] Form validates correctly
- [ ] API route validates and authorizes
- [ ] No hardcoded colors or spacing
- [ ] Animation uses design tokens for duration
