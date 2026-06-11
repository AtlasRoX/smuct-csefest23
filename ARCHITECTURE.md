# CSE Fest 2026 — Architecture Reference

> Technical stack decisions, data models, and system architecture.  
> All implementation choices must be justified against this document.

---

## Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4 (CSS-first config, design token driven)
- **Component Library:** shadcn/ui (customized, not default)
- **Animation:** Framer Motion
- **Charts:** Recharts (custom-styled, not default chart styles)
- **Tables:** TanStack Table v8
- **Icons:** Lucide React (exclusively)
- **Fonts:** Space Grotesk (headings), Inter (body), Geist Mono (numbers)

### Backend
- **Runtime:** Next.js API Routes (or separate Node/Express if needed)
- **Database:** Supabase (PostgreSQL with RLS)
- **Auth:** Supabase Auth (email + Google OAuth)
- **File Storage:** Cloudinary (student ID images, competition banners, payment screenshots)
- **Google Integration:** Google Sheets API v4 (data sync)

---

## Database Schema (Core Entities)

### users
```
id, email, role (participant | admin), created_at, updated_at
```

### profiles
```
id, user_id, full_name, phone, gender,
university, department, semester, student_id,
github, portfolio, skills[], bio, tshirt_size,
verification_status (incomplete | pending | verified),
created_at, updated_at
```

### student_verifications
```
id, user_id, id_front_url, id_back_url,
status (incomplete | pending | verified),
reviewed_by, reviewed_at, created_at
```

### competitions
```
id, name, type, description, short_description,
cover_image_url, banner_image_url,
eligibility (internal | external | both),
solo_allowed, team_allowed, min_members, max_members,
registration_start, registration_end,
submission_start, submission_end,
entry_fee, payment_instructions,
submission_required, template_link, rulebook_url,
judging_criteria (jsonb), finalist_limit,
prize_pool, champion_prize, runner_up_prize, second_runner_up,
status (draft | published | registration_open | registration_closed | archived),
created_at, updated_at
```

### teams
```
id, name, logo_url, competition_id, leader_id,
status (forming | registered | submitted | selected | rejected | finalist),
created_at, updated_at
```

### team_members
```
id, team_id, user_id, role (leader | member),
invitation_status (pending | accepted | rejected),
joined_at
```

### submissions
```
id, team_id, competition_id, title, google_docs_url,
notes, status (draft | submitted | under_review | selected | rejected),
submitted_at, reviewed_at, reviewed_by
```

### payments
```
id, team_id, competition_id, amount,
transaction_id, screenshot_url, method (bkash | nagad),
status (pending | approved | rejected | resubmission_required),
reviewed_by, reviewed_at, created_at
```

### scores
```
id, team_id, competition_id, criteria_name, weight,
score, max_score, entered_by, created_at
```

### rankings
```
id, team_id, competition_id, total_score, rank_position,
is_finalist, is_public, created_at, updated_at
```

### notifications
```
id, user_id, title, message, type,
read, action_url, created_at
```

### announcements
```
id, title, content, priority, type,
status (draft | published | archived),
publish_date, expiry_date, pinned, created_at
```

### ticker_items
```
id, message, pinned, scheduled_at, active, created_at
```

### faqs
```
id, question, answer, display_order, visible, created_at
```

### contact_info
```
id, email, phone, facebook, linkedin, address, maps_url, updated_at
```

### audit_logs
```
id, admin_id, action, resource_type, resource_id,
previous_value (jsonb), new_value (jsonb), created_at
```

---

## Authentication Flow

```
Sign Up → Profile Setup Wizard → Student ID Upload
→ Pending Verification → Admin Verifies → Verified
→ Competition Registration Unlocked
```

### Google OAuth
- Link existing accounts by matching email
- Redirect to profile setup on first login

---

## Storage Architecture (Cloudinary)

| Asset Type | Folder | Rules |
|------------|--------|-------|
| Student ID Front | `csefest/verifications/{user_id}/front` | Max 5MB, JPG/PNG only |
| Student ID Back | `csefest/verifications/{user_id}/back` | Max 5MB, JPG/PNG only |
| Payment Screenshot | `csefest/payments/{payment_id}` | Max 5MB, JPG/PNG only |
| Competition Banner | `csefest/competitions/{id}/banner` | Max 10MB |
| Competition Cover | `csefest/competitions/{id}/cover` | Max 10MB |
| Team Logo | `csefest/teams/{id}/logo` | Max 2MB |

---

## API Route Structure

```
/api/auth/           — Supabase Auth callbacks
/api/profile/        — Profile CRUD
/api/verification/   — Student ID submission
/api/competitions/   — Competition CRUD
/api/teams/          — Team management + invitations
/api/submissions/    — Proposal submission
/api/payments/       — Payment submission + verification
/api/judging/        — Score entry + ranking calculation
/api/notifications/  — Notification system
/api/admin/          — Admin-only operations
/api/cms/            — Announcements, FAQ, Contact, Ticker
/api/analytics/      — Dashboard metrics
/api/sheets/         — Google Sheets sync
/api/export/         — CSV/Excel export
```

---

## Row Level Security (RLS) Model

```
participants: read own data only
teams: read all, write own teams only
competitions: read all (published), write admin only
submissions: read own team's, write own team's (within deadline)
payments: read own, write admin (verify)
profiles: read own, admin reads all
audit_logs: admin only
```

---

## Score Calculation Logic

```typescript
// Weighted score per criterion
score_contribution = (score / max_score) * weight

// Total score
total = sum(score_contributions)

// Ranking
ORDER BY total DESC, submitted_at ASC
// Tie-break: higher score → earlier submission → manual override
```

---

## Google Sheets Sync Engine

### Strategy
1. First sync: creates sheet with all data, stores sync metadata
2. Subsequent syncs: detect changes via `updated_at` comparison
3. Duplicate prevention: use platform ID as row key

### Sheets Created
- Participants, Teams, Payments, Submissions, Rankings, Finalists

### Selective Export
Admin selects: Competition + Data Type + Columns + Destination Sheet

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

### Optimization Requirements
- Code splitting per route
- Lazy loading for below-fold content
- Image optimization (Next.js `<Image>`, Cloudinary transforms)
- Skeleton loaders on all async data
- SWR or React Query for client-side caching
- Database indexes on frequently queried columns

---

## Security Requirements

| Layer | Implementation |
|-------|---------------|
| Authentication | Supabase Auth with JWT |
| Authorization | RLS policies + middleware role checks |
| File uploads | Type validation, size limits, Cloudinary scanning |
| API | Input validation (Zod), rate limiting |
| Admin routes | Server-side role verification on every request |
| Audit trail | Log all admin mutations |

---

## Key Business Rules (Enforced in Code)

1. Unverified users cannot register for competitions
2. Team size must respect competition `min_members` / `max_members`
3. Submissions lock after `submission_end` (admin override available)
4. A user can only be in one team per competition
5. Payment only required for Phase 2 (external) or all (internal)
6. Admin cannot be a participant in the same session context
7. Rankings are only public if admin explicitly publishes them
