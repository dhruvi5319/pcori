-- ============================================================
-- PCORI Research Analytics Platform — V1__initial_schema.sql
-- Database: PostgreSQL 16
-- Phase 1 scope: Auth tables only
-- Conventions:
--   - All PKs: UUID DEFAULT gen_random_uuid()
--   - All timestamps: TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   - Soft-delete: deleted_at TIMESTAMPTZ DEFAULT NULL
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
