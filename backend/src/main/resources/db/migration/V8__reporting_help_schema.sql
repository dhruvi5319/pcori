-- V8: Phase 4 — Reporting & Help Center schema
-- Depends on: V1–V6 (Phase 1–2 foundation)
-- NOTE: V7 is reserved for Phase 3 (Insights); this migration skips to V8 intentionally

-- §5 REPORTS
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
    UNIQUE (owner_id, name)
);
CREATE INDEX idx_report_config_owner ON report_configurations(owner_id) WHERE deleted_at IS NULL;

CREATE TABLE excel_reports (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID          REFERENCES report_configurations(id),
    status           report_status NOT NULL DEFAULT 'GENERATING',
    generated_at     TIMESTAMPTZ,
    file_path        VARCHAR(500),
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

-- §7 HELP CENTER
CREATE TABLE help_articles (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(100) NOT NULL UNIQUE,
    category         VARCHAR(100) NOT NULL,
    content          TEXT         NOT NULL,
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
    UNIQUE (article_id, user_id)
);
CREATE INDEX idx_feedback_article ON documentation_feedback(article_id);
