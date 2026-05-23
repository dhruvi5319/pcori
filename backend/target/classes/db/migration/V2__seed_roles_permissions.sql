-- ============================================================
-- V2__seed_roles_permissions.sql
-- Seeds: 5 roles + permissions + role_permission mappings
-- ============================================================

-- Insert roles (idempotent — safe to re-run with DO NOTHING)
INSERT INTO roles (id, name, description) VALUES
    (gen_random_uuid(), 'REVIEWER',       'Research plan reviewer — upload, view, and override classifications'),
    (gen_random_uuid(), 'MANAGER',        'Program manager — all reviewer permissions plus dashboards, analytics, and reports'),
    (gen_random_uuid(), 'TAXONOMY_ADMIN', 'Taxonomy administrator — full CRUD on PCORI/ICD-10 taxonomy categories'),
    (gen_random_uuid(), 'ADMIN',          'System administrator — all permissions including user management and pipeline control'),
    (gen_random_uuid(), 'VIEWER',         'Executive / stakeholder — read-only access to dashboard, analytics, and reports')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions (resource:action pairs)
INSERT INTO permissions (id, name, resource, action) VALUES
    -- Classifications
    (gen_random_uuid(), 'classifications:read',     'classifications', 'read'),
    (gen_random_uuid(), 'classifications:write',    'classifications', 'write'),
    (gen_random_uuid(), 'classifications:override', 'classifications', 'override'),
    (gen_random_uuid(), 'classifications:delete',   'classifications', 'delete'),
    (gen_random_uuid(), 'classifications:retry',    'classifications', 'retry'),
    -- Taxonomy
    (gen_random_uuid(), 'taxonomy:read',   'taxonomy', 'read'),
    (gen_random_uuid(), 'taxonomy:manage', 'taxonomy', 'manage'),
    -- Dashboard & Analytics
    (gen_random_uuid(), 'dashboard:read',  'dashboard', 'read'),
    (gen_random_uuid(), 'analytics:read',  'analytics', 'read'),
    -- Reports
    (gen_random_uuid(), 'reports:read',    'reports', 'read'),
    (gen_random_uuid(), 'reports:write',   'reports', 'write'),
    -- Pipeline
    (gen_random_uuid(), 'pipeline:read',   'pipeline', 'read'),
    (gen_random_uuid(), 'pipeline:manage', 'pipeline', 'manage'),
    -- Users
    (gen_random_uuid(), 'users:read',      'users', 'read'),
    (gen_random_uuid(), 'users:manage',    'users', 'manage'),
    -- Files
    (gen_random_uuid(), 'files:read',      'files', 'read'),
    -- Notifications
    (gen_random_uuid(), 'notifications:read',  'notifications', 'read'),
    (gen_random_uuid(), 'notifications:write', 'notifications', 'write'),
    -- Help
    (gen_random_uuid(), 'help:read',       'help', 'read')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- REVIEWER: classifications (read/write/override/retry), taxonomy:read, files:read, notifications, help
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'REVIEWER'
  AND p.name IN (
      'classifications:read', 'classifications:write',
      'classifications:override', 'classifications:retry',
      'taxonomy:read', 'files:read',
      'notifications:read', 'notifications:write', 'help:read'
  )
ON CONFLICT DO NOTHING;

-- MANAGER: all REVIEWER perms + dashboard, analytics, reports, pipeline:read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.name IN (
      'classifications:read', 'classifications:write',
      'classifications:override', 'classifications:retry',
      'taxonomy:read', 'files:read',
      'dashboard:read', 'analytics:read',
      'reports:read', 'reports:write',
      'pipeline:read',
      'notifications:read', 'notifications:write', 'help:read'
  )
ON CONFLICT DO NOTHING;

-- TAXONOMY_ADMIN: taxonomy manage + read, classifications:read, help:read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'TAXONOMY_ADMIN'
  AND p.name IN (
      'taxonomy:read', 'taxonomy:manage',
      'classifications:read',
      'notifications:read', 'help:read'
  )
ON CONFLICT DO NOTHING;

-- ADMIN: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- VIEWER: read-only — dashboard, analytics, reports:read, help:read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'VIEWER'
  AND p.name IN (
      'dashboard:read', 'analytics:read',
      'reports:read', 'classifications:read',
      'notifications:read', 'help:read'
  )
ON CONFLICT DO NOTHING;
