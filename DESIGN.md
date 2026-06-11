# CSE Fest 2026 — Design System

> Source of truth for all visual decisions. Applies to Figma, frontend code, and component library.

---

## Design Philosophy

Every screen must feel: **Premium · Modern · Fast · Clean · Intelligent**

Prioritize:
- **Clarity** over decoration
- **Hierarchy** over complexity  
- **Consistency** over creativity

The platform must feel like a **premium technology product** — not a university portal.

---

## Brand Feel

| Reference | Quality Borrowed |
|-----------|-----------------|
| Apple | Simplicity, premium feel |
| Linear | Precision, speed |
| Vercel | Polish, developer-grade UI |
| GitHub | Credibility, information density |
| Stripe | Clarity, financial-grade reliability |

---

## Color System

### Palette

| Token | Description | Use |
|-------|-------------|-----|
| `primary` | Deep Indigo | Brand, hero, CTA |
| `secondary` | Electric Violet | Highlights, statistics, accents |
| `accent` | Soft Cyan | Hover states, success indicators, interactive elements |
| `success` | Green | Approval states |
| `warning` | Amber | Deadline / caution states |
| `error` | Red | Error / reject states |

### Neutrals

| Token | Description |
|-------|-------------|
| `neutral-950` | Near Black (main background) |
| `neutral-900` | Dark Slate (cards) |
| `neutral-800` | Elevated Components |
| `neutral-700` | Modals |
| `neutral-400` | Muted Text |
| `neutral-50` | White / High Contrast |

### Rules
- Never use plain red, blue, or green directly — use the token palette
- Never mix warm and cool neutrals in the same view
- All semantic colors must meet WCAG AA contrast ratios

---

## Surface System

| Surface | Use | Background |
|---------|-----|------------|
| Surface 1 | Main page background | `neutral-950` |
| Surface 2 | Cards | `neutral-900` |
| Surface 3 | Elevated components | `neutral-800` |
| Surface 4 | Modals and overlays | `neutral-700` |

---

## Typography

### Font Stack

| Role | Font | Use Case |
|------|------|----------|
| Headings | **Space Grotesk** | All titles, section headers |
| Body | **Inter** | All body copy, labels, UI text |
| Numbers | **Geist Mono** | Scores, IDs, stats, counts |

### Type Scale

| Token | Size | Use |
|-------|------|-----|
| `display-xl` | 96px | Hero titles |
| `display-lg` | 72px | Hero sections |
| `h1` | 56px | Page titles |
| `h2` | 48px | Section titles |
| `h3` | 36px | Subsection titles |
| `h4` | 28px | Card titles |
| `h5` | 24px | Sub-card titles |
| `body-lg` | 18px | Lead paragraphs |
| `body` | 16px | Standard body text |
| `sm` | 14px | Captions, labels |
| `xs` | 12px | Timestamps, metadata |

---

## Spacing System

**Never use arbitrary values. Only use these tokens (px):**

```
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128
```

### Layout Tokens

| Token | Value |
|-------|-------|
| Page padding (desktop) | 32px |
| Page padding (tablet) | 24px |
| Page padding (mobile) | 16px |
| Section gap | 96px |
| Component gap | 24px |
| Card padding | 24px |

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 8px | Inputs, small cards |
| `radius-md` | 12px | Cards |
| `radius-lg` | 16px | Panels |
| `radius-xl` | 24px | Modals |
| `radius-full` | 999px | Badges, pills, status indicators |

---

## Shadow System

| Level | Context | Style |
|-------|---------|-------|
| Level 1 | Cards (default) | Subtle |
| Level 2 | Hover state | Lifted |
| Level 3 | Modals | Deep |
| Level 4 | Hero elements | Premium glow with brand color |

---

## Background System

No flat backgrounds. Every page must have depth.

| Layer | Type | Notes |
|-------|------|-------|
| Primary | Animated gradient mesh | Very subtle movement |
| Secondary | Technology grid pattern | Low opacity |
| Decorative | Floating particles | Slow, lightweight |

---

## Animation System

### Philosophy

> Motion must communicate **meaning, feedback, hierarchy** — never decoration alone.

### Durations

| Token | Duration | Use |
|-------|----------|-----|
| `duration-fast` | 150ms | Micro-interactions, hover |
| `duration-normal` | 250ms | Standard transitions |
| `duration-complex` | 400ms | Multi-part animations |
| `duration-page` | 500ms | Page transitions (max) |

### Hover Behaviors

| Element | Effect |
|---------|--------|
| Cards | Lift + scale(1.02) + shadow increase |
| Buttons | Subtle scale + background transition |
| Navigation | Underline animation |
| Competition cards | Lift + glow + gradient border + scale |

### Motion Types
- Fade, Slide, Scale, Blur Reveal, Parallax, Mouse Tracking

### Page Transitions
- Fade / Slide / Blur — max 500ms

---

## Glassmorphism Rules

**Use sparingly.**

| Allowed | Forbidden |
|---------|-----------|
| Navbar | Forms |
| Ticker | Tables |
| Modals | Dense information areas |
| Hero elements | Inputs |
| Stats cards | Data-heavy panels |

---

## Icon System

**Library: Lucide Icons — exclusively.**

- No mixing of icon sets
- No custom SVG icons unless absolutely necessary
- Consistent stroke width throughout

---

## Layout System

| Token | Value |
|-------|-------|
| Max container width | 1440px |
| Content width | 1200px |
| Desktop grid | 12 columns |
| Tablet grid | 8 columns |
| Mobile grid | 4 columns |

---

## Component Library

### Buttons

| Variant | Use | Style |
|---------|-----|-------|
| Primary | Main CTA (Register, Submit, Create Team) | Filled, strong contrast |
| Secondary | Secondary actions | Outlined |
| Ghost | Low priority actions | Text only |
| Destructive | Delete, Reject, Remove | Red accent |

**Rules:** Every button must have hover state, focus state, loading state, and disabled state.

### Input Components

| Component | Notes |
|-----------|-------|
| Text Input | States: Default / Focused / Error / Disabled |
| Text Area | For descriptions, bio, notes |
| Select | Searchable |
| Multi-Select | For skills, tags |
| File Upload | Drag & Drop, preview, validation, progress indicator |

### Card System

| Card Type | Contains |
|-----------|----------|
| Competition Card | Banner, Title, Description, Prize, Deadline, CTA |
| Team Card | Team Name, Members, Competition, Status |
| Stats Card | Metric, Value, Trend indicator |
| Notification Card | Title, Description, Timestamp |

### Table System

**Library: TanStack Table**

Required features: Search, Filter, Sort, Pagination, Column Visibility, Export

### Status Badges

| System | States |
|--------|--------|
| Verification | Incomplete · Pending · Verified |
| Submission | Draft · Submitted · Under Review · Selected · Rejected |
| Payment | Pending · Approved · Rejected · Resubmission Required |
| Competition | Draft · Published · Registration Open · Registration Closed · Archived |

---

## Empty States

Every empty page must have:
1. Illustration
2. Contextual explanation
3. Action button

❌ Bad: `"No Data"`  
✅ Good: `"No Teams Yet — Create your first team to join a competition."`

---

## Loading States

**Use skeleton loaders — never a standalone spinner.**

---

## Modal System

| Size | Use |
|------|-----|
| Small | Confirmation dialogs |
| Medium | Editing forms |
| Large | Review / detail panels |
| Fullscreen | Preview |

---

## Notification System (Toast)

| Type | Use |
|------|-----|
| Info | General updates |
| Success | Action completed |
| Warning | Deadline / caution |
| Error | Failed operation |

- Desktop: Top-right
- Mobile: Bottom

---

## Error Handling UX

Every error must explain: **What happened → Why → How to fix**

❌ Bad: `"Something went wrong"`  
✅ Good: `"Payment screenshot exceeds 5MB. Please upload a smaller image."`

---

## Accessibility Standards

- WCAG AA minimum compliance
- Keyboard navigable
- Visible focus states
- Proper aria labels
- Semantic HTML
- Sufficient color contrast
- Screen reader support

---

## Responsive Breakpoints

| Breakpoint | Width |
|------------|-------|
| xs | 320px |
| sm | 375px |
| md | 390px |
| lg | 768px |
| xl | 1024px |
| 2xl | 1280px |
| 3xl | 1440px |
| 4xl | 1920px |

**Mobile first. No horizontal scrolling. Ever.**

Touch targets: Minimum 44px.

---

## Dashboard Patterns

### Admin Dashboard

Must feel like: **Stripe + Linear + Vercel**

- Collapsible sidebar
- Global search in topbar (Ctrl+K)
- Notifications in topbar
- KPI cards: large numbers, trend indicator, icon
- Activity feed: timeline style, newest first
- Data tables: sticky header, bulk actions, search

### Participant Dashboard

Simpler than admin. Focus on: Teams · Competitions · Deadlines · Notifications

- Desktop: Sidebar + Content + Topbar
- Mobile: Bottom navigation
- Quick actions always visible

---

## Design Do's
- Use clear visual hierarchy
- Use whitespace generously
- Use motion intentionally
- Use consistent spacing tokens
- Build reusable components
- Design mobile-first
- Prioritize readability

## Design Don'ts
- No arbitrary spacing or random colors
- No mixed icon libraries
- No overuse of glassmorphism
- No hidden actions
- No unnecessary multi-step flows
- No generic dashboard templates
- No excessive animations
- Never sacrifice usability for aesthetics
