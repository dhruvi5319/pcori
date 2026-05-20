# UX Mockup — PCORI Research Analytics Platform

**Project:** PCORI Research Analytics Platform
**Generated:** 2026-05-20
**Based on:** UserStories-PCORI.md v1.0, PRD-PCORI.md v1.0, FRD-PCORI.md v1.0, JOURNEYS-PCORI.md v1.0
**Authoritative Design Source:** PRD §8.1–8.7

---

## Overview

The PCORI Research Analytics Platform is a secure, responsive web application for AI-assisted classification of research plan PDFs against the PCORI taxonomy. The UX is built around five distinct personas with non-overlapping core workflows, all converging on a single audit trail.

### Design Principles

1. **Speed over ceremony** — Reviewers complete a full classify-or-override cycle in ≤10 minutes. Every primary action is one click.
2. **Audit confidence** — Every significant action surfaces the acting user's name and timestamp at point of completion, not buried in a separate audit log.
3. **Status always visible** — Pipeline health, classification status, and notification counts are visible from every screen.
4. **Failure is explicit** — `FAILED` and `NEEDS_REVIEW` states are never hidden; they are highlighted and actionable.
5. **Color + text always together** — Status badges always include a text label alongside color (WCAG 2.1 AA).

### Design System (PRD §8.1)

| Aspect | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 (CSS-first `@import "tailwindcss"`, no config file) |
| Component Primitives | Radix UI — Dialog, Dropdown, Tabs, Toast, Tooltip |
| Charts | Recharts (`isAnimationActive={false}` in production) |
| Icons | lucide-react |
| Toasts | sonner (top-right, rich colors) |
| Fonts | Geist (sans), Geist Mono (monospaced — logs, code) |
| Forms | react-hook-form + zod; inline field-level errors; submit disabled until valid |
| Theming | next-themes (light/dark; auto-swapping favicons) |
| Server State | TanStack Query v5 (explicit `staleTime` per resource; `staleTime: 0` avoided) |

### Color Tokens (PRD §8.5)

| Token | Use |
|---|---|
| `primary` | Brand color, primary CTAs |
| `secondary` | Secondary actions, links |
| `chart-1..5` | Chart series colors |
| `destructive` | Delete buttons, error states |
| `muted` | Disabled / secondary text |
| `accent` | Hover highlights |
| Status: green | `CLASSIFIED` |
| Status: blue pulsing | `PROCESSING` |
| Status: gray | `PENDING` |
| Status: red | `FAILED` |
| Status: amber | `NEEDS_REVIEW` |

### Navigation Structure (PRD §8.2)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo] │ Dashboard │ Classifications │ Taxonomy │ Analytics │        │
│         │ Pipeline  │ Reports         │ Users    │ Help      │        │
│                                                [🔔 N] [User ▾] Logout │
├──────────────────────────────────────────────────────────────────────┤
│  <route content>                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Footer: branding · links · version                                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Public routes** (no auth): `/`, `/login`, `/signup`
**Protected routes** (JWT required): `/dashboard`, `/classifications`, `/taxonomy`, `/data-pipeline`, `/analytics`, `/reports`, `/users`, `/help`

Role-gated nav items (rendered only when role permits):
- `Users` — ADMIN only
- `Pipeline` — ADMIN + MANAGER
- `Analytics` — MANAGER + VIEWER
- `Taxonomy` edit controls — TAXONOMY_ADMIN only

### Information Architecture Summary

| Route | Persona | Priority |
|---|---|---|
| `/` | Public | Landing |
| `/login` | All | P0 |
| `/signup` | All | P0 |
| `/dashboard` | All (role-filtered) | P1 |
| `/classifications` | REVIEWER + MANAGER | P0 |
| `/taxonomy` | TAXONOMY_ADMIN + REVIEWER (read) | P0 |
| `/data-pipeline` | ADMIN + MANAGER | P1 |
| `/analytics` | MANAGER + VIEWER | P1 |
| `/reports` | MANAGER + VIEWER | P1 |
| `/users` | ADMIN | P0 |
| `/help` | All | P2 |

---
