# Requirements: PCORI Research Analytics Platform

**Defined:** 2026-05-20
**Core Value:** Reviewers upload a research plan PDF and receive an automated taxonomy classification in minutes instead of hours — with a full audit trail of every decision and override.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Authorization

- [ ] **FR-1.1**: User can register with username, email, password, first/last name
- [ ] **FR-1.2**: User can log in and receive a JWT (1-hour validity by default, configurable)
- [ ] **FR-1.3**: Failed login attempts are tracked; accounts auto-lock after a configurable threshold
- [ ] **FR-1.4**: User can request password reset; reset token expires after a configurable TTL
- [ ] **FR-1.5**: Email verification flow for new accounts
- [ ] **FR-1.6**: Logout invalidates the client session and clears local tokens
- [ ] **FR-1.7**: All non-auth endpoints require a valid `Authorization: Bearer <jwt>` header
- [ ] **FR-1.8**: Role-based access control (roles ↔ permissions many-to-many) gates admin features

### Research Plan Upload & Classification

- [ ] **FR-2.1**: Reviewer can upload PDF research plans (multipart)
- [ ] **FR-2.2**: System extracts PDF text and runs classification asynchronously
- [ ] **FR-2.3**: A Classification record is created with an auto-generated planId (format `RP-YYYY-###`)
- [ ] **FR-2.4**: Each classification stores: PCC, taxonomy category/code/subcode, project summary, population, intervention, comparator, primary/secondary outcomes, confidence score, model version, processing time
- [ ] **FR-2.5**: Classification status lifecycle: `PENDING`, `PROCESSING`, `CLASSIFIED`, `FAILED`, `NEEDS_REVIEW`
- [ ] **FR-2.6**: Reviewer can manually override classification fields and supply a reason; `reviewedBy` and `reviewedAt` are recorded
- [ ] **FR-2.7**: Failed classifications can be retried
- [ ] **FR-2.8**: Classifications can be filtered, searched, paginated, and sorted

### Taxonomy Management

- [ ] **FR-3.1**: Admin can CRUD PCORI/ICD-10 taxonomy categories
- [ ] **FR-3.2**: Categories support a parent-child hierarchy (tree)
- [ ] **FR-3.3**: Categories can be activated/deactivated without deletion
- [ ] **FR-3.4**: User can search taxonomy by code, name, or category text
- [ ] **FR-3.5**: User can retrieve children of a node and view full tree

### Dashboards & Analytics

- [ ] **FR-4.1**: Dashboard shows totals by status (total, classified, processing, pending, failed, needs-review)
- [ ] **FR-4.2**: Average confidence score is displayed on dashboard
- [ ] **FR-4.3**: A "Recent Classifications" feed shows the latest N items
- [ ] **FR-4.4**: Analytics page shows accuracy trend, category accuracy, confidence distribution, processing volume, recent overrides, model performance
- [ ] **FR-4.5**: Per-user dashboard widget layout configurations are persisted
- [ ] **FR-4.6**: Metrics can be queried by date range

### Pipeline Monitoring

- [ ] **FR-5.1**: User can view status, stages, and health of the classification pipeline
- [ ] **FR-5.2**: Admin can start, stop, pause, and resume a pipeline run
- [ ] **FR-5.3**: Admin can retry an individual failed pipeline stage
- [ ] **FR-5.4**: User can view pipeline logs, run history, and DB connection health
- [ ] **FR-5.5**: Admin can trigger a manual sync

### Reports

- [ ] **FR-6.1**: User can generate Excel reports from classification data
- [ ] **FR-6.2**: User can download generated reports (`Content-Disposition` exposed in CORS)
- [ ] **FR-6.3**: User can save reusable report templates
- [ ] **FR-6.4**: User can build ad-hoc reports with selectable columns and filters

### User Management

- [ ] **FR-7.1**: Admin can CRUD users and assign roles
- [ ] **FR-7.2**: Admin can toggle user active/inactive status
- [ ] **FR-7.3**: Admin can search and filter users

### Notifications

- [ ] **FR-8.1**: User receives in-app notifications for relevant events (classification done, pipeline failure, etc.)
- [ ] **FR-8.2**: Per-user notification preferences are configurable

### Help Center

- [ ] **FR-9.1**: User can browse help articles and FAQs
- [ ] **FR-9.2**: User can submit documentation feedback

### File Management

- [ ] **FR-10.1**: Uploaded files are tracked in an `UploadedFile` entity
- [ ] **FR-10.2**: Files are persisted to object storage (S3 or compatible)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Real-time & Integrations

- **V2-01**: WebSocket-based real-time pipeline status updates (currently polling-based)
- **V2-02**: SSO (SAML/OIDC) integration
- **V2-03**: Direct integration with external grant management systems
- **V2-04**: Bulk batch upload via SFTP drop

### Advanced Analytics

- **V2-05**: Drift detection for model performance degradation
- **V2-06**: Model A/B testing framework
- **V2-07**: Custom ML model training UI

### Multi-tenancy

- **V2-08**: Cross-organization data sharing or federated analytics
- **V2-09**: Multi-tenant architecture

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile-native apps | Responsive web only (≥768 px graceful degradation); mobile-native is v2+ |
| Real-time collaborative editing of plans | High complexity, not core to classification value |
| Custom ML training UI | Model plugged in by engineering; training UI is a separate product |
| Cross-org / federated analytics | Single-tenant v1; multi-tenancy is v2 |
| SSO (SAML/OIDC) | Email/password JWT sufficient for v1 |
| SFTP bulk upload | v2+; single-file upload covers v1 use case |
| Blockchain audit trail | Overkill anti-pattern; database audit trail is sufficient |
| In-browser PDF preview | Complex, not core to classification workflow |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FR-1.1 | Phase 1 | Pending |
| FR-1.2 | Phase 1 | Pending |
| FR-1.3 | Phase 1 | Pending |
| FR-1.4 | Phase 1 | Pending |
| FR-1.5 | Phase 1 | Pending |
| FR-1.6 | Phase 1 | Pending |
| FR-1.7 | Phase 1 | Pending |
| FR-1.8 | Phase 1 | Pending |
| FR-2.1 | Phase 2 | Pending |
| FR-2.2 | Phase 2 | Pending |
| FR-2.3 | Phase 2 | Pending |
| FR-2.4 | Phase 2 | Pending |
| FR-2.5 | Phase 2 | Pending |
| FR-2.6 | Phase 2 | Pending |
| FR-2.7 | Phase 2 | Pending |
| FR-2.8 | Phase 2 | Pending |
| FR-3.1 | Phase 2 | Pending |
| FR-3.2 | Phase 2 | Pending |
| FR-3.3 | Phase 2 | Pending |
| FR-3.4 | Phase 2 | Pending |
| FR-3.5 | Phase 2 | Pending |
| FR-4.1 | Phase 3 | Pending |
| FR-4.2 | Phase 3 | Pending |
| FR-4.3 | Phase 3 | Pending |
| FR-4.4 | Phase 3 | Pending |
| FR-4.5 | Phase 3 | Pending |
| FR-4.6 | Phase 3 | Pending |
| FR-5.1 | Phase 3 | Pending |
| FR-5.2 | Phase 3 | Pending |
| FR-5.3 | Phase 3 | Pending |
| FR-5.4 | Phase 3 | Pending |
| FR-5.5 | Phase 3 | Pending |
| FR-6.1 | Phase 4 | Pending |
| FR-6.2 | Phase 4 | Pending |
| FR-6.3 | Phase 4 | Pending |
| FR-6.4 | Phase 4 | Pending |
| FR-7.1 | Phase 4 | Pending |
| FR-7.2 | Phase 4 | Pending |
| FR-7.3 | Phase 4 | Pending |
| FR-8.1 | Phase 4 | Pending |
| FR-8.2 | Phase 4 | Pending |
| FR-9.1 | Phase 4 | Pending |
| FR-9.2 | Phase 4 | Pending |
| FR-10.1 | Phase 2 | Pending |
| FR-10.2 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-20 after initial definition*
