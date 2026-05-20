# PCORI Research Analytics Platform

## What This Is

The PCORI Research Analytics Platform is a secure, full-stack web application that automates the classification of patient-centered medical research plans against the PCORI taxonomy (Primary Clinical Condition, taxonomy category, code, subcode). It replaces a slow, manual review process with an AI-assisted workflow covering PDF upload, automated classification, manual override, analytics dashboards, and report generation. The platform targets PCORI research reviewers, program managers, taxonomy administrators, system administrators, and executive stakeholders.

## Core Value

Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **FR-1** Authentication & Authorization — register, login/logout, JWT, account lockout, password reset, email verification, RBAC
- [ ] **FR-2** Research Plan Upload & Classification — PDF upload, text extraction, auto-classification, status tracking, manual override, retry, search/filter/paginate
- [ ] **FR-3** Taxonomy Management — CRUD PCORI/ICD-10 categories, hierarchical tree, activate/deactivate, search
- [ ] **FR-4** Dashboards & Analytics — KPI cards, status breakdowns, accuracy trends, confidence distribution, processing volume, override table, model performance, date-range filtering, per-user widget configs
- [ ] **FR-5** Pipeline Monitoring — view status/stages/health, start/stop/pause/resume, stage-level retry, logs, run history, manual sync
- [ ] **FR-6** Reports — Excel generation/download, ad-hoc builder, reusable templates, saved filter configs
- [ ] **FR-7** User Management (Admin) — CRUD users, role assignment, activate/deactivate, search/filter
- [ ] **FR-8** Notifications — in-app notifications for key events, per-user notification preferences
- [ ] **FR-9** Help Center — browse articles/FAQs, submit documentation feedback
- [ ] **FR-10** File Management — track uploaded files, persist to S3-compatible object storage

### Out of Scope

- Cross-organization data sharing / federated analytics — single-tenant v1 only
- Mobile-native apps — responsive web only (≥768 px graceful degradation)
- Real-time collaborative editing of plans — not required for v1
- Direct integration with external grant management systems — v2+
- Custom ML model training UI — model plugged in by engineering
- WebSocket real-time pipeline updates — v2+
- SSO (SAML/OIDC) — v2+; email/password JWT sufficient for v1
- Advanced analytics (drift detection, model A/B testing) — v2+
- Bulk batch upload via SFTP — v2+
- Multi-tenancy — v2+

## Context

- **Domain:** PCORI (Patient-Centered Outcomes Research Institute) — healthcare research classification; potential HIPAA-aligned controls required (to be reviewed by compliance).
- **Classification model:** Third-party API or self-hosted ML model; keyword-based fallback acceptable for early iterations. Specific model selection (OpenAI / Anthropic / Bedrock / in-house) is an open question.
- **Taxonomy data:** PCORI taxonomy + ICD-10 codes. Canonical seed data source TBD (open question).
- **Storage:** S3-compatible object storage for uploaded PDFs; specific provider (AWS S3, Azure Blob, local NFS) TBD.
- **Email:** SMTP relay for verification and password reset; provider (SES, SendGrid, Mailgun) TBD.
- **Scale target:** ~16 backend controllers, ~80+ API endpoints. Single-tenant v1.
- **PRD reference:** `project_specs/ref_docs/PRD.md` (v1.0) — canonical source for functional requirements and UI specs.

## Constraints

- **Tech Stack (Backend):** Spring Boot 3.4, Java 21, JPA, HikariCP, Docker — defined in PRD.
- **Tech Stack (Frontend):** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts, react-hook-form + zod, next-themes — defined in PRD.
- **Auth:** JWT stateless (1-hour default, configurable); BCrypt password hashing; account lockout after configurable failed-login threshold.
- **Security:** JWT secret from env vars only (never source); CORS restricted to known production origins; HTTPS in production; all `/api/**` endpoints except public auth require authentication.
- **Performance:** Classification response < 2 s for a 10-page PDF (excluding model latency); dashboard initial load < 1.5 s; P95 API < 500 ms.
- **Accessibility:** WCAG 2.1 AA target; Radix UI primitives for keyboard nav + ARIA.
- **Database:** Dev: H2 (in-container); Production: PostgreSQL or MySQL.
- **Compliance:** HIPAA-aligned controls to be reviewed; PHI/PII handling requirements TBD.
- **Internationalization:** English-only v1; copy externalized for future i18n.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Spring Boot 3.4 + Java 21 backend | Existing PCORI engineering ecosystem; strong JPA/security libs | — Pending |
| Next.js 16 App Router + React 19 frontend | Modern SSR/SSG, TypeScript-first, pairs well with Tailwind + Radix | — Pending |
| JWT stateless auth (no server-side sessions) | Horizontal scalability; stateless backend behind load balancer | — Pending |
| Keyword-based classification fallback for early iterations | Allows shipping before ML model is selected/integrated | — Pending |
| H2 in dev → PostgreSQL/MySQL in production | Fast dev iteration; production-grade DB for reliability | — Pending |
| Soft-delete preferred over hard-delete | Data retention requirement; classifications retained indefinitely | — Pending |
| Single-tenant v1 | Reduces complexity; multi-tenant deferred to v2 | — Pending |

---
*Last updated: 2026-05-20 after initialization from PRD v1.0*
