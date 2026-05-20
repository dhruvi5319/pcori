---

## Y0: Database Schema (Full DDL)

**Database:** PostgreSQL 16 (dev: Docker Compose; prod: PostgreSQL or MySQL)
**Migrations:** Flyway versioned (`V{n}__*.sql`) + repeatable (`R__*.sql`). PostgreSQL-specific SQL from V1.
**Auditing:** All entities extend `AuditableEntity` — `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`, `created_by UUID REFERENCES users(id)`, `last_modified_by UUID REFERENCES users(id)`.
**Soft-delete:** `deleted_at TIMESTAMPTZ DEFAULT NULL`; `@SQLRestriction("deleted_at IS NULL")` on all JPA entities. **Native SQL queries must explicitly add `AND deleted_at IS NULL`.**

---

### §Auth — Users, Roles, Permissions

```sql
-- V1__initial_schema.sql (excerpt)

CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_users_email         ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username      ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_reset_token   ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_verify_token  ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

CREATE TABLE roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE permissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
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
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

---

### §Taxonomy — TaxonomyCategory

```sql
CREATE TABLE taxonomy_categories (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    parent_id     UUID         REFERENCES taxonomy_categories(id) ON DELETE RESTRICT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    level         INTEGER      NOT NULL DEFAULT 0,
    display_order INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    UUID         REFERENCES users(id),
    last_modified_by UUID      REFERENCES users(id),
    deleted_at    TIMESTAMPTZ,
    UNIQUE (code, parent_id)  -- code unique within sibling group
);

CREATE INDEX idx_taxonomy_code      ON taxonomy_categories(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_parent    ON taxonomy_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_active    ON taxonomy_categories(is_active) WHERE deleted_at IS NULL;
-- Full-text search column
ALTER TABLE taxonomy_categories ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(code,'') || ' ' || coalesce(name,'') || ' ' || coalesce(description,''))
    ) STORED;
CREATE INDEX idx_taxonomy_fts ON taxonomy_categories USING GIN(search_vector);
```

*Seed data: loaded via `R__seed_taxonomy.sql` (Flyway repeatable; upsert on `code`).*

---

### §Classification — Classifications, UploadedFiles

```sql
CREATE TYPE classification_status AS ENUM (
    'PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW'
);

CREATE TABLE uploaded_files (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename      VARCHAR(500) NOT NULL,  -- S3 object key
    original_name VARCHAR(255) NOT NULL,
    content_type  VARCHAR(100) NOT NULL,
    size          BIGINT       NOT NULL,
    path          VARCHAR(500) NOT NULL,  -- S3 object key (same as filename)
    uploaded_by   UUID         NOT NULL REFERENCES users(id),
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_files_uploaded_by ON uploaded_files(uploaded_by) WHERE deleted_at IS NULL;

CREATE TABLE classifications (
    id                   UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id              VARCHAR(20)            NOT NULL UNIQUE,  -- RP-YYYY-###
    title                VARCHAR(255),
    status               classification_status  NOT NULL DEFAULT 'PENDING',
    -- Taxonomy fields
    pcc                  VARCHAR(255),
    taxonomy_category    VARCHAR(255),
    taxonomy_code        VARCHAR(100),
    taxonomy_subcode     VARCHAR(100),
    primary_condition    VARCHAR(255),
    secondary_conditions TEXT,
    icd_codes            TEXT,
    -- Extracted content
    project_summary      TEXT,
    population_setting   TEXT,
    intervention         TEXT,
    comparator           TEXT,
    primary_outcome      TEXT,
    secondary_outcomes   TEXT,
    text_preview         VARCHAR(500),          -- truncated extracted text; max 500 chars
    extraction_warning   VARCHAR(255),
    -- Classification metadata
    confidence_score     DECIMAL(5,4),          -- 0.0000 to 1.0000
    model_version        VARCHAR(100),
    processing_time_ms   INTEGER,
    -- File reference
    file_id              UUID                   REFERENCES uploaded_files(id),
    file_name            VARCHAR(255),
    file_size            BIGINT,
    file_path            VARCHAR(500),
    notes                TEXT,
    -- Audit / review
    uploaded_by          UUID                   NOT NULL REFERENCES users(id),
    uploaded_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    classified_at        TIMESTAMPTZ,
    reviewed_by          UUID                   REFERENCES users(id),
    reviewed_at          TIMESTAMPTZ,
    override_reason      TEXT,
    error_message        TEXT,
    -- AuditableEntity base
    created_at           TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    created_by           UUID                   REFERENCES users(id),
    last_modified_by     UUID                   REFERENCES users(id),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_class_status       ON classifications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_plan_id      ON classifications(plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_by  ON classifications(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_at  ON classifications(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_pcc          ON classifications(pcc) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_processing   ON classifications(status, updated_at) WHERE status = 'PROCESSING' AND deleted_at IS NULL;
-- Full-text search on plan_id + title
ALTER TABLE classifications ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(plan_id,'') || ' ' || coalesce(title,''))
    ) STORED;
CREATE INDEX idx_class_fts ON classifications USING GIN(search_vector);
```

---

### §Dashboard — DashboardConfiguration, DashboardMetric

```sql
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
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    value        DECIMAL(15,4) NOT NULL,
    category     VARCHAR(100),
    recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dash_metrics_name_date ON dashboard_metrics(name, recorded_at DESC);
CREATE INDEX idx_dash_metrics_category  ON dashboard_metrics(category, recorded_at DESC);
```

---

### §Reports — ReportConfiguration, ExcelReport, FilterConfiguration

```sql
CREATE TYPE report_status AS ENUM ('GENERATING', 'READY', 'FAILED');

CREATE TABLE report_configurations (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    owner_id    UUID        NOT NULL REFERENCES users(id),
    columns     JSONB       NOT NULL DEFAULT '[]',
    filters     JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,
    UNIQUE (owner_id, name)  -- template name unique per user
);

CREATE TABLE excel_reports (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID          REFERENCES report_configurations(id),
    status           report_status NOT NULL DEFAULT 'GENERATING',
    generated_at     TIMESTAMPTZ,
    file_path        VARCHAR(500),  -- S3 key; null until READY
    error_message    TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_excel_reports_config ON excel_reports(configuration_id) WHERE deleted_at IS NULL;

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
```

---

### §Notifications — Notification, NotificationPreference

```sql
CREATE TYPE notification_type AS ENUM (
    'CLASSIFICATION_COMPLETED', 'CLASSIFICATION_FAILED',
    'CLASSIFICATION_NEEDS_REVIEW', 'PIPELINE_FAILURE', 'OVERRIDE_SUBMITTED'
);

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL');

CREATE TABLE notifications (
    id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        notification_type  NOT NULL,
    title       VARCHAR(255)       NOT NULL,
    message     TEXT               NOT NULL,
    is_read     BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_date   ON notifications(user_id, created_at DESC) WHERE deleted_at IS NULL;

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
```

---

### §Help — HelpArticle, FAQ, DocumentationFeedback

```sql
CREATE TABLE help_articles (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title        VARCHAR(255) NOT NULL,
    slug         VARCHAR(100) NOT NULL UNIQUE,
    category     VARCHAR(100) NOT NULL,
    content      TEXT         NOT NULL,  -- Markdown
    published_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   UUID         REFERENCES users(id),
    last_modified_by UUID     REFERENCES users(id),
    deleted_at   TIMESTAMPTZ
);

ALTER TABLE help_articles ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
    ) STORED;
CREATE INDEX idx_help_fts  ON help_articles USING GIN(search_vector);
CREATE INDEX idx_help_slug ON help_articles(slug) WHERE deleted_at IS NULL;

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

CREATE TABLE documentation_feedback (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id   UUID        NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    helpful      BOOLEAN     NOT NULL,
    comment      TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (article_id, user_id)  -- one feedback per user per article (upsert)
);
```

---

### §Pipeline — Pipeline Event Log (Optional)

```sql
-- Optional persistence for pipeline run history; managed in-memory otherwise
CREATE TABLE pipeline_runs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    status           VARCHAR(20) NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    records_processed INTEGER     DEFAULT 0,
    failed_count      INTEGER     DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id      UUID        REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    level       VARCHAR(10) NOT NULL,  -- INFO, WARN, ERROR
    message     VARCHAR(1000) NOT NULL,
    logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_logs_run ON pipeline_logs(run_id, logged_at DESC);
```

---

### Entity Summary

| Entity | Table | Soft-Delete | FRD Section |
|---|---|---|---|
| User | `users` | yes | F00, F06 |
| Role | `roles` | yes | F00 |
| Permission | `permissions` | no | F00 |
| UserRole (join) | `user_roles` | no | F00 |
| RolePermission (join) | `role_permissions` | no | F00 |
| TaxonomyCategory | `taxonomy_categories` | yes | F02 |
| UploadedFile | `uploaded_files` | yes | F09 |
| Classification | `classifications` | yes | F01 |
| DashboardConfiguration | `dashboard_configurations` | yes | F03 |
| DashboardMetric | `dashboard_metrics` | no | F03 |
| ReportConfiguration | `report_configurations` | yes | F05 |
| ExcelReport | `excel_reports` | yes | F05 |
| FilterConfiguration | `filter_configurations` | yes | F05 |
| Notification | `notifications` | yes | F07 |
| NotificationPreference | `notification_preferences` | no | F07 |
| HelpArticle | `help_articles` | yes | F08 |
| FAQ | `faqs` | yes | F08 |
| DocumentationFeedback | `documentation_feedback` | no | F08 |
| PipelineRun (optional) | `pipeline_runs` | no | F04 |
| PipelineLog (optional) | `pipeline_logs` | no | F04 |
