-- ============================================================
-- PCORI Research Analytics Platform — V3__add_audit_columns.sql
-- Add JPA audit columns required by AuditableEntity @MappedSuperclass
-- AuditableEntity maps: created_by, last_modified_by
-- These were omitted from V1 DDL; added here for JPA ddl-auto=validate compatibility
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_by       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(255);
