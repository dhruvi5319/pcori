-- ============================================================
-- PCORI Research Analytics Platform — V7__insights_schema.sql
-- Phase 3: Insights — Dashboard, Notifications, Pipeline tables
-- ============================================================

-- §4 DASHBOARD
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

-- §6 NOTIFICATIONS
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
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE deleted_at IS NULL;
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

-- §8 PIPELINE PERSISTENCE
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
    level     VARCHAR(10)   NOT NULL,
    message   VARCHAR(1000) NOT NULL,
    logged_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pipeline_logs_run ON pipeline_logs(run_id, logged_at DESC);
