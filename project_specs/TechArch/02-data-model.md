---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
┌──────────────────┐         ┌────────────────────┐
│      users       │─────────│     user_roles      │
│ PK id            │  1    * │ PK user_id (FK)     │
│    username      │         │ PK role_id (FK)     │
│    email         │         └─────────┬───────────┘
│    password_hash │                   │ *
│    is_active     │         ┌─────────▼───────────┐
│    is_email_     │         │       roles         │
│    verified      │         │ PK id               │
│    locked_until  │         │    name             │
│    login_attempts│         │    description      │
└──┬───────────────┘         └─────────┬───────────┘
   │                                   │ *
   │ 1                       ┌─────────▼───────────┐
   │                         │  role_permissions   │
   │                         │ PK role_id (FK)     │
   │                         │ PK permission_id (FK│
   │                         └─────────┬───────────┘
   │                                   │ *
   │                         ┌─────────▼───────────┐
   │                         │    permissions      │
   │                         │ PK id               │
   │                         │    name             │
   │                         │    resource, action │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   uploaded_files    │
   │  (uploaded_by)          │ PK id               │
   │                         │    filename (S3 key)│
   │  1                      │    original_name    │
   ├────────────────────────►│    content_type     │
   │  (uploaded_by)          │    size             │
   │                         │    path             │
   │  1                      │    uploaded_by (FK) │
   ├────────────────────────►└──────────┬──────────┘
   │  (reviewed_by)                     │ 1
   │                                    │
   │                         ┌──────────▼──────────┐
   │                         │   classifications   │
   │                         │ PK id               │
   │                         │    plan_id (unique) │
   │                         │    title, status    │
   │                         │    pcc, taxonomy_*  │
   │                         │    confidence_score │
   │                         │    model_version    │
   │                         │    text_preview     │
   │                         │    extraction_warning│
   │                         │    override_reason  │
   │                         │    uploaded_by (FK) │
   │                         │    reviewed_by (FK) │
   │                         │    file_id (FK)     │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│taxonomy_categories  │
   │                         │ PK id               │
   │                         │    code (unique/sib)│
   │                         │    name, description│
   │                         │    parent_id → self │
   │                         │    level (0–3)      │
   │                         │    is_active        │
   │                         │    display_order    │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│dashboard_config     │
   │                         │ PK id               │
   │                         │    user_id (unique) │
   │                         │    layout (JSONB)   │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │  dashboard_metrics  │
   │                         │ PK id               │
   │                         │    name, value      │
   │                         │    category         │
   │                         │    recorded_at      │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│ report_configurations│
   │  (owner_id)             │ PK id               │
   │                         │    name, owner_id   │
   │                         │    columns (JSONB)  │
   │                         │    filters (JSONB)  │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │    excel_reports    │
   │                         │ PK id               │
   │                         │    config_id (FK)   │
   │                         │    status (enum)    │
   │                         │    file_path        │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│filter_configurations │
   │  (user_id)              │ PK id               │
   │                         │    user_id, name    │
   │                         │    criteria (JSONB) │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   notifications     │
   │  (user_id)              │ PK id               │
   │                         │    user_id, type    │
   │                         │    title, message   │
   │                         │    is_read          │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│notification_prefs   │
   │  (user_id)              │ PK id               │
   │                         │    user_id, event   │
   │                         │    channel, enabled │
   │                         └─────────────────────┘
   │
   │ 1                       ┌─────────────────────┐
   ├────────────────────────►│   help_articles     │
   │  (created_by)           │ PK id               │
   │                         │    title, slug      │
   │                         │    category, content│
   │                         │    published_at     │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │documentation_feedbk │
   │                         │ PK id               │
   │                         │    article_id (FK)  │
   │                         │    user_id (FK)     │
   │                         │    helpful, comment │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │       faqs          │
   │                         │ PK id               │
   │                         │    question, answer │
   │                         │    category         │
   │                         │    display_order    │
   │                         └─────────────────────┘
   │
   │                         ┌─────────────────────┐
   │                         │   pipeline_runs     │
   │                         │ PK id               │
   │                         │    status           │
   │                         │    started_at       │
   │                         │    completed_at     │
   │                         └──────────┬──────────┘
   │                                    │ 1
   │                         ┌──────────▼──────────┐
   │                         │   pipeline_logs     │
   │                         │ PK id               │
   │                         │    run_id (FK)      │
   │                         │    level, message   │
   │                         │    logged_at        │
   │                         └─────────────────────┘
```

### 3.2 AuditableEntity Base Class

All domain entities extend `AuditableEntity`. Fields automatically populated by Spring Data JPA Auditing:

```java
// common/audit/AuditableEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;        // username from SecurityContext

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private String lastModifiedBy;
}
```

### 3.3 Complete Database DDL (Flyway — V1__initial_schema.sql)

```sql
-- ============================================================
-- PCORI Research Analytics Platform — V1__initial_schema.sql
-- Database: PostgreSQL 16
-- Conventions:
--   - All PKs: UUID DEFAULT gen_random_uuid()
--   - All timestamps: TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   - Soft-delete: deleted_at TIMESTAMPTZ DEFAULT NULL
--   - Audit: created_by / last_modified_by UUID FK → users(id)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- §1  AUTH — users, roles, permissions
-- ──────────────────────────────────────────────────────────

CREATE TABLE users (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username                    VARCHAR(50)  NOT NULL UNIQUE,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password_hash               VARCHAR(255) NOT NULL,
    first_name                  VARCHAR(100) NOT NULL,
    last_name                   VARCHAR(100) NOT NULL,
    phone_number                VARCHAR(20),
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified           BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verification_token    UUID,
    password_reset_token        UUID,
    password_reset_expires_at   TIMESTAMPTZ,
    last_login_at               TIMESTAMPTZ,
    login_attempts              INTEGER      NOT NULL DEFAULT 0,
    locked_until                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ
);

CREATE INDEX idx_users_email        ON users(email)    WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username     ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_reset_token  ON users(password_reset_token)
    WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_verify_token ON users(email_verification_token)
    WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_locked       ON users(locked_until)
    WHERE locked_until IS NOT NULL;

CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_token_value  ON refresh_tokens(token) WHERE revoked = FALSE;
CREATE INDEX idx_refresh_token_user   ON refresh_tokens(user_id) WHERE revoked = FALSE;

CREATE TABLE roles (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE permissions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    resource    VARCHAR(100) NOT NULL,
    action      VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ──────────────────────────────────────────────────────────
-- §2  TAXONOMY
-- ──────────────────────────────────────────────────────────

CREATE TABLE taxonomy_categories (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    parent_id        UUID         REFERENCES taxonomy_categories(id) ON DELETE RESTRICT,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    level            INTEGER      NOT NULL DEFAULT 0,
    display_order    INTEGER      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       UUID         REFERENCES users(id),
    last_modified_by UUID         REFERENCES users(id),
    deleted_at       TIMESTAMPTZ,
    UNIQUE (code, parent_id)  -- code unique within sibling group (allows NULL parent)
);

CREATE INDEX idx_taxonomy_code   ON taxonomy_categories(code)      WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_parent ON taxonomy_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_active ON taxonomy_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_level  ON taxonomy_categories(level)     WHERE deleted_at IS NULL AND is_active = TRUE;

-- Full-text search vector (generated + stored)
ALTER TABLE taxonomy_categories ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(code, '') || ' ' ||
            COALESCE(name, '') || ' ' ||
            COALESCE(description, ''))
    ) STORED;
CREATE INDEX idx_taxonomy_fts ON taxonomy_categories USING GIN(search_vector);

-- ──────────────────────────────────────────────────────────
-- §3  FILES + CLASSIFICATIONS
-- ──────────────────────────────────────────────────────────

CREATE TABLE uploaded_files (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename         VARCHAR(500) NOT NULL,   -- S3 object key
    original_name    VARCHAR(255) NOT NULL,
    content_type     VARCHAR(100) NOT NULL,
    size             BIGINT       NOT NULL,
    path             VARCHAR(500) NOT NULL,   -- S3 object key
    uploaded_by      UUID         NOT NULL REFERENCES users(id),
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_files_uploaded_by ON uploaded_files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_at ON uploaded_files(uploaded_at DESC) WHERE deleted_at IS NULL;

CREATE TYPE classification_status AS ENUM (
    'PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW'
);

CREATE TABLE classifications (
    id                   UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id              VARCHAR(20)           NOT NULL UNIQUE,  -- RP-YYYY-###
    title                VARCHAR(255),
    status               classification_status NOT NULL DEFAULT 'PENDING',
    -- Taxonomy assignment fields
    pcc                  VARCHAR(255),
    taxonomy_category    VARCHAR(255),
    taxonomy_code        VARCHAR(100),
    taxonomy_subcode     VARCHAR(100),
    primary_condition    VARCHAR(255),
    secondary_conditions TEXT,
    icd_codes            TEXT,
    -- Extracted content (truncated; never full text)
    project_summary      TEXT,
    population_setting   TEXT,
    intervention         TEXT,
    comparator           TEXT,
    primary_outcome      TEXT,
    secondary_outcomes   TEXT,
    text_preview         VARCHAR(500),         -- max 500 chars; no PHI logged
    extraction_warning   VARCHAR(255),
    -- Classification metadata
    confidence_score     DECIMAL(5,4),         -- 0.0000–1.0000
    model_version        VARCHAR(100),         -- 'keyword-v1' or ML provider version
    processing_time_ms   INTEGER,
    -- File reference
    file_id              UUID                  REFERENCES uploaded_files(id),
    file_name            VARCHAR(255),
    file_size            BIGINT,
    file_path            VARCHAR(500),         -- S3 object key
    notes                TEXT,
    -- Review trail
    uploaded_by          UUID                  NOT NULL REFERENCES users(id),
    uploaded_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    classified_at        TIMESTAMPTZ,
    reviewed_by          UUID                  REFERENCES users(id),
    reviewed_at          TIMESTAMPTZ,
    override_reason      TEXT,
    error_message        TEXT,
    -- AuditableEntity base fields
    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    created_by           UUID                  REFERENCES users(id),
    last_modified_by     UUID                  REFERENCES users(id),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_class_status      ON classifications(status)       WHERE deleted_at IS NULL;
CREATE INDEX idx_class_plan_id     ON classifications(plan_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_by ON classifications(uploaded_by)  WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_at ON classifications(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_pcc         ON classifications(pcc)          WHERE deleted_at IS NULL;
CREATE INDEX idx_class_processing  ON classifications(status, updated_at)
    WHERE status = 'PROCESSING' AND deleted_at IS NULL;  -- startup recovery query
CREATE INDEX idx_class_reviewed_by ON classifications(reviewed_by)
    WHERE reviewed_by IS NOT NULL AND deleted_at IS NULL;

-- Full-text search on plan_id + title
ALTER TABLE classifications ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(plan_id, '') || ' ' || COALESCE(title, ''))
    ) STORED;
CREATE INDEX idx_class_fts ON classifications USING GIN(search_vector);

-- ──────────────────────────────────────────────────────────
-- §4  DASHBOARD
-- ──────────────────────────────────────────────────────────

CREATE TABLE dashboard_configurations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    layout      JSONB       NOT NULL DEFAULT '{}',
    widgets     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_dash_config_user ON dashboard_configurations(user_id) WHERE deleted_at IS NULL;

CREATE TABLE dashboard_metrics (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)  NOT NULL,
    value       DECIMAL(15,4) NOT NULL,
    category    VARCHAR(100),
    recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dash_metrics_name_date ON dashboard_metrics(name, recorded_at DESC);
CREATE INDEX idx_dash_metrics_category  ON dashboard_metrics(category, recorded_at DESC);

-- ──────────────────────────────────────────────────────────
-- §5  REPORTS
-- ──────────────────────────────────────────────────────────

CREATE TYPE report_status AS ENUM ('GENERATING', 'READY', 'FAILED');

CREATE TABLE report_configurations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    owner_id    UUID         NOT NULL REFERENCES users(id),
    columns     JSONB        NOT NULL DEFAULT '[]',
    filters     JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (owner_id, name)   -- template name unique per user (among non-deleted)
);

CREATE INDEX idx_report_config_owner ON report_configurations(owner_id) WHERE deleted_at IS NULL;

CREATE TABLE excel_reports (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID          REFERENCES report_configurations(id),
    status           report_status NOT NULL DEFAULT 'GENERATING',
    generated_at     TIMESTAMPTZ,
    file_path        VARCHAR(500),  -- S3 object key; null until READY
    error_message    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_excel_reports_config ON excel_reports(configuration_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_excel_reports_status ON excel_reports(status) WHERE deleted_at IS NULL;

CREATE TABLE filter_configurations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id),
    name        VARCHAR(100) NOT NULL,
    criteria    JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (user_id, name)
);

CREATE INDEX idx_filter_config_user ON filter_configurations(user_id) WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────
-- §6  NOTIFICATIONS
-- ──────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM (
    'CLASSIFICATION_COMPLETED',
    'CLASSIFICATION_FAILED',
    'CLASSIFICATION_NEEDS_REVIEW',
    'PIPELINE_FAILURE',
    'OVERRIDE_SUBMITTED'
);

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL');

CREATE TABLE notifications (
    id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type NOT NULL,
    title       VARCHAR(255)      NOT NULL,
    message     TEXT              NOT NULL,
    is_read     BOOLEAN           NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read)         WHERE deleted_at IS NULL;
CREATE INDEX idx_notif_user_date   ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE notification_preferences (
    id          UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  notification_type    NOT NULL,
    channel     notification_channel NOT NULL,
    enabled     BOOLEAN              NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_type, channel)
);

-- ──────────────────────────────────────────────────────────
-- §7  HELP CENTER
-- ──────────────────────────────────────────────────────────

CREATE TABLE help_articles (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(100) NOT NULL UNIQUE,
    category         VARCHAR(100) NOT NULL,
    content          TEXT         NOT NULL,   -- Markdown; sanitized in frontend
    published_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       UUID         REFERENCES users(id),
    last_modified_by UUID         REFERENCES users(id),
    deleted_at       TIMESTAMPTZ
);

ALTER TABLE help_articles ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, ''))
    ) STORED;
CREATE INDEX idx_help_fts  ON help_articles USING GIN(search_vector);
CREATE INDEX idx_help_slug ON help_articles(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_help_cat  ON help_articles(category) WHERE deleted_at IS NULL;

CREATE TABLE faqs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    question      TEXT         NOT NULL,
    answer        TEXT         NOT NULL,
    category      VARCHAR(100) NOT NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    UUID         REFERENCES users(id),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_faq_category ON faqs(category) WHERE deleted_at IS NULL;

CREATE TABLE documentation_feedback (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id   UUID        NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helpful      BOOLEAN     NOT NULL,
    comment      TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (article_id, user_id)   -- upsert: one feedback per user per article
);

CREATE INDEX idx_feedback_article ON documentation_feedback(article_id);

-- ──────────────────────────────────────────────────────────
-- §8  PIPELINE (optional persistence)
-- ──────────────────────────────────────────────────────────

CREATE TABLE pipeline_runs (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    status            VARCHAR(20) NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,
    records_processed INTEGER     NOT NULL DEFAULT 0,
    failed_count      INTEGER     NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status, started_at DESC);

CREATE TABLE pipeline_logs (
    id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id    UUID          REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    level     VARCHAR(10)   NOT NULL,     -- INFO, WARN, ERROR
    message   VARCHAR(1000) NOT NULL,     -- never contains extracted text
    logged_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_logs_run ON pipeline_logs(run_id, logged_at DESC);
```

### 3.4 Flyway Migration Strategy

```
src/main/resources/db/migration/
├── V1__initial_schema.sql          # All tables above; PostgreSQL-specific syntax from V1
├── V2__seed_roles_permissions.sql  # INSERT roles (REVIEWER, MANAGER, TAXONOMY_ADMIN, ADMIN, VIEWER)
│                                   # INSERT permissions (classifications:write, taxonomy:manage, etc.)
│                                   # INSERT role_permissions
└── R__seed_taxonomy.sql            # Repeatable; PCORI taxonomy upsert on (code, parent_id)
                                    # Re-runs on any content change; idempotent
```

**Key Flyway rules:**
- `spring.flyway.enabled=true` in all profiles
- `spring.jpa.hibernate.ddl-auto=validate` in production (never `create-drop`)
- Dev uses PostgreSQL 16 via Docker Compose — H2 is eliminated to prevent dialect gaps
- `flyway-database-postgresql` artifact required for Flyway 10.x + PostgreSQL
- `R__seed_taxonomy.sql` uses `INSERT ... ON CONFLICT (code, parent_id) DO UPDATE` (upsert)
- All migrations are forward-only; no `undo` scripts needed for v1

### 3.5 Entity Summary

| Entity | Table | Soft-Delete | Extends AuditableEntity | Notes |
|---|---|---|---|---|
| User | `users` | yes (`deleted_at`) | yes | BCrypt hash; RBAC FK |
| RefreshToken | `refresh_tokens` | no | no | Server-side revocation |
| Role | `roles` | yes | no | Seeded via V2 migration |
| Permission | `permissions` | no | no | Seeded via V2 migration |
| UserRole (join) | `user_roles` | no | no | Many-to-many |
| RolePermission (join) | `role_permissions` | no | no | Many-to-many |
| TaxonomyCategory | `taxonomy_categories` | yes | yes | Self-referential; GIN FTS |
| UploadedFile | `uploaded_files` | yes | no | S3 object key in `path` |
| Classification | `classifications` | yes | yes | Core aggregate; GIN FTS |
| DashboardConfiguration | `dashboard_configurations` | yes | no | Per-user JSONB layout |
| DashboardMetric | `dashboard_metrics` | no | no | Time-series pre-aggregation |
| ReportConfiguration | `report_configurations` | yes | no | Named template |
| ExcelReport | `excel_reports` | yes | no | Artifact; S3 path when READY |
| FilterConfiguration | `filter_configurations` | yes | no | Saved filter set |
| Notification | `notifications` | yes | no | Per-user events |
| NotificationPreference | `notification_preferences` | no | no | Per-user per-channel |
| HelpArticle | `help_articles` | yes | yes | Markdown; GIN FTS |
| FAQ | `faqs` | yes | no | Accordion item |
| DocumentationFeedback | `documentation_feedback` | no | no | Upsert per user/article |
| PipelineRun | `pipeline_runs` | no | no | Optional audit persistence |
| PipelineLog | `pipeline_logs` | no | no | Event log; no PHI |

---

*Section 3 of 7 — TechArch-PCORI.md*
