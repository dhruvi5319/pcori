# Functional Requirements Document (FRD)
## PCORI Research Analytics Platform

| Field | Value |
|---|---|
| **Product Name** | PCORI Research Analytics Platform |
| **Project Acronym** | PCORI |
| **FRD Version** | 1.0 |
| **Source PRD** | `project_specs/ref_docs/PRD.md` v1.0 |
| **Date** | 2026-05-20 |
| **Status** | Draft — awaiting compliance review before real PHI data |

---

## Scope

This document specifies the functional behavior of the PCORI Research Analytics Platform in sufficient detail for implementation without ambiguity. It covers all ten functional requirements (FR-1 through FR-10) mapped to PRD features F0 through F9. Each section defines exact inputs, outputs, validation rules, error states, API surface, and database schema surface. Cross-feature concerns (full DDL, consolidated API catalog, error codes, external integrations) are captured in the Y-series appendices.

**In scope:** All features in PRD v1.0 phases 1–4 (functional implementation). Phase 5 (ML provider swap) and Phase 6 (hardening) are architecturally specified but provider-specific parameters are marked TBD.

**Out of scope:** SSO/SAML, WebSocket real-time, multi-tenancy, ML model training UI, cross-org federation. See PRD §3.2.

---

## How to Read This Document

- **Feature chunks** are named `F{nn}-{slug}.md` (zero-padded). Each covers one PRD feature / FR group.
- **FR-IDs** (e.g., `FR-1.1`) match the canonical requirement IDs in `ref_docs/PRD.md` Section 6 exactly.
- **Y-series chunks** contain cross-feature technical specs: schema DDL, API catalog, error catalog, integration contracts.
- **Tables** use compact format (≤4 columns). Full DDL in `Y0-schema.md`; full API in `Y1-api.md`.
- **"see §"** cross-references refer to sections within the assembled `FRD-PCORI.md`.

---

## Master Table of Contents

| Section | File | Description |
|---|---|---|
| **F00** | `F00-authentication-authorization.md` | FR-1: Auth, JWT, RBAC, account lifecycle |
| **F01** | `F01-research-plan-upload-classification.md` | FR-2: PDF upload, async pipeline, classification, override |
| **F02** | `F02-taxonomy-management.md` | FR-3: PCORI/ICD-10 taxonomy CRUD, hierarchy, search |
| **F03** | `F03-dashboards-analytics.md` | FR-4: KPI cards, analytics charts, widget config |
| **F04** | `F04-pipeline-monitoring.md` | FR-5: Pipeline stage health, controls, logs |
| **F05** | `F05-reports.md` | FR-6: Excel export, ad-hoc builder, templates |
| **F06** | `F06-user-management.md` | FR-7: Admin user CRUD, role assignment |
| **F07** | `F07-notifications.md` | FR-8: In-app notifications, preferences |
| **F08** | `F08-help-center.md` | FR-9: Articles, FAQs, feedback |
| **F09** | `F09-file-management.md` | FR-10: S3 storage, UploadedFile entity, pre-signed URLs |
| **Y0** | `Y0-schema.md` | Database DDL — all entities |
| **Y1** | `Y1-api.md` | REST API endpoint catalog — all controllers |
| **Y2** | `Y2-errors.md` | Cross-feature HTTP error catalog |
| **Y3** | `Y3-integrations.md` | External integration contracts |

---

## Cross-Cutting Terminology

| Term | Meaning |
|---|---|
| **PCORI** | Patient-Centered Outcomes Research Institute |
| **PCC** | Primary Clinical Condition (e.g., Type 2 Diabetes, Heart Failure) |
| **Taxonomy Category** | High-level PCORI research grouping (e.g., Shared Decision Making, Telehealth) |
| **Taxonomy Code / Subcode** | Short alphanumeric codes describing intervention type |
| **Classification** | A processed research plan record with assigned taxonomy fields |
| **Override** | Manual correction of automated classification by a reviewer; reason is **required** |
| **Pipeline** | Three-stage async process: PDF extract → classify → persist |
| **planId** | Auto-generated plan identifier, format `RP-YYYY-###` (e.g., `RP-2026-001`) |
| **ICD-10** | International Classification of Diseases, 10th Revision |
| **NEEDS_REVIEW** | Classification status: AI confidence fell below admin-configurable threshold (default 0.75) |
| **BAA** | Business Associate Agreement — required before processing PHI with ML provider |
| **AuditableEntity** | JPA `@MappedSuperclass` base with `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy` |
| **Soft-delete** | `deleted_at` timestamp set instead of row removal; `@SQLRestriction("deleted_at IS NULL")` applied |
| **JWT** | JSON Web Token; 1-hour default validity; secret from env var only |
| **RBAC** | Role-Based Access Control via `User → Role → Permission` many-to-many model |
| **Pre-signed URL** | Temporary S3 object URL with 15-minute TTL; never a permanent public URL |
| **`202 Accepted`** | Upload response pattern: request accepted, pipeline runs asynchronously |
| **StorageService** | Interface abstracting S3/MinIO/Azure Blob; swappable via `@ConditionalOnProperty` |
| **ClassificationStrategy** | Interface abstracting keyword vs. ML classification; swappable via `@ConditionalOnProperty` |

---

## Cross-Cutting Non-Functional Requirements (Summary)

These apply to every feature and are not repeated in individual feature chunks.

| Category | Requirement |
|---|---|
| **Security** | JWT secret from env var only (512-bit min); BCrypt password hashing; CORS restricted to known origins; no wildcard; HTTPS in prod; account lockout; Swagger UI disabled in prod profile |
| **Performance** | Upload `202` response < 2 s (excluding model latency); dashboard load < 1.5 s; P95 API < 500 ms (excl. inference); page size default 25 |
| **Auditability** | All entities extend `AuditableEntity`; every classification stores `uploadedBy`, `reviewedBy`, `overrideReason`, `modelVersion`; soft-delete everywhere |
| **PHI Safeguards** | Extracted PDF text never logged above TRACE; never stored in full in DB; S3 denies public access; pre-signed URLs only; compliance review before real PHI |
| **Data Integrity** | `SecurityContextPropagatingDecorator` (TaskDecorator) on `classificationExecutor` prevents null audit fields in async threads |
| **Accessibility** | WCAG 2.1 AA; Radix UI primitives; color never sole status indicator; focus trap on dialogs; explicit form labels |
| **Reliability** | Startup recovery for stuck `PROCESSING` records; `CallerRunsPolicy` on executor; failed classifications retryable |
| **Database** | Dev: PostgreSQL 16 via Docker Compose (H2 eliminated); Prod: PostgreSQL or MySQL; `ddl-auto=validate` in prod; Flyway migrations from V1 |

---

## Personas and Roles

| Persona | Application Role | Key Permissions |
|---|---|---|
| Research Reviewer | `REVIEWER` | Upload plans, view classifications, submit overrides |
| Program Manager | `MANAGER` | All Reviewer perms + dashboards, reports, analytics |
| Taxonomy Administrator | `TAXONOMY_ADMIN` | Taxonomy CRUD, activate/deactivate codes |
| System Administrator | `ADMIN` | All perms + user CRUD, role assignment, pipeline control |
| Executive / Stakeholder | `VIEWER` | Read-only: dashboard, analytics, reports download |

---

*FRD v1.0 — PCORI Research Analytics Platform*
*Generated: 2026-05-20*
