-- ============================================================
-- PCORI Research Analytics Platform — V6__fix_audit_columns_type.sql
-- Ensure audit timestamp columns on Phase 2 tables use TIMESTAMPTZ
-- This migration is a no-op guard: V4/V5 already use TIMESTAMPTZ,
-- but the version number is reserved per the Phase 3 migration plan.
-- ============================================================

-- No schema changes required; V4 and V5 already defined all
-- timestamp columns as TIMESTAMPTZ. This migration exists to
-- preserve the sequential version history expected by V7.
SELECT 1;
