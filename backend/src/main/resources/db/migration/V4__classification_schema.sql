-- ============================================================
-- V4__classification_schema.sql
-- uploaded_files + classifications tables for Phase 2
-- ============================================================

-- classification_status ENUM
CREATE TYPE classification_status AS ENUM (
    'PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW'
);

-- ──────────────────────────────────────────────────────────
-- uploaded_files
-- ──────────────────────────────────────────────────────────
CREATE TABLE uploaded_files (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    filename         VARCHAR(500) NOT NULL,
    original_name    VARCHAR(255) NOT NULL,
    content_type     VARCHAR(100) NOT NULL,
    size             BIGINT       NOT NULL,
    path             VARCHAR(500) NOT NULL,
    uploaded_by      UUID         NOT NULL REFERENCES users(id),
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_files_uploaded_by ON uploaded_files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_at ON uploaded_files(uploaded_at DESC) WHERE deleted_at IS NULL;

-- ──────────────────────────────────────────────────────────
-- classifications
-- ──────────────────────────────────────────────────────────
CREATE TABLE classifications (
    id                   UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id              VARCHAR(20)           NOT NULL UNIQUE,
    title                VARCHAR(255),
    status               classification_status NOT NULL DEFAULT 'PENDING',
    pcc                  VARCHAR(255),
    taxonomy_category    VARCHAR(255),
    taxonomy_code        VARCHAR(100),
    taxonomy_subcode     VARCHAR(100),
    primary_condition    VARCHAR(255),
    secondary_conditions TEXT,
    icd_codes            TEXT,
    project_summary      TEXT,
    population_setting   TEXT,
    intervention         TEXT,
    comparator           TEXT,
    primary_outcome      TEXT,
    secondary_outcomes   TEXT,
    text_preview         VARCHAR(500),
    extraction_warning   VARCHAR(255),
    confidence_score     DECIMAL(5,4),
    model_version        VARCHAR(100),
    processing_time_ms   INTEGER,
    file_id              UUID                  REFERENCES uploaded_files(id),
    file_name            VARCHAR(255),
    file_size            BIGINT,
    file_path            VARCHAR(500),
    notes                TEXT,
    uploaded_by          UUID                  NOT NULL REFERENCES users(id),
    uploaded_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    classified_at        TIMESTAMPTZ,
    reviewed_by          UUID                  REFERENCES users(id),
    reviewed_at          TIMESTAMPTZ,
    override_reason      TEXT,
    error_message        TEXT,
    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(255),
    last_modified_by     VARCHAR(255),
    deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_class_status      ON classifications(status)           WHERE deleted_at IS NULL;
CREATE INDEX idx_class_plan_id     ON classifications(plan_id)          WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_by ON classifications(uploaded_by)      WHERE deleted_at IS NULL;
CREATE INDEX idx_class_uploaded_at ON classifications(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_class_pcc         ON classifications(pcc)              WHERE deleted_at IS NULL;
CREATE INDEX idx_class_processing  ON classifications(status, updated_at)
    WHERE status = 'PROCESSING' AND deleted_at IS NULL;
CREATE INDEX idx_class_reviewed_by ON classifications(reviewed_by)
    WHERE reviewed_by IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE classifications ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(plan_id, '') || ' ' || COALESCE(title, ''))
    ) STORED;
CREATE INDEX idx_class_fts ON classifications USING GIN(search_vector);
