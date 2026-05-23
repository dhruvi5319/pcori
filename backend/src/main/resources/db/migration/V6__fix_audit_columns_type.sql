-- ============================================================
-- V6__fix_audit_columns_type.sql
-- Fix: created_by / last_modified_by in taxonomy_categories and
--      classifications must be VARCHAR(255) to match
--      AuditableEntity @CreatedBy/@LastModifiedBy (String, not UUID).
--
-- Decision recorded in STATE.md:
--   "created_by/last_modified_by in Classification and TaxonomyCategory
--    mapped as VARCHAR(255) String (not UUID) to match AuditableEntity pattern"
--
-- V4 (classifications) and V5 (taxonomy_categories) mistakenly used
--   UUID REFERENCES users(id) — corrected here.
-- ============================================================

-- taxonomy_categories: drop FK constraint + change type
ALTER TABLE taxonomy_categories
    DROP CONSTRAINT IF EXISTS taxonomy_categories_created_by_fkey,
    DROP CONSTRAINT IF EXISTS taxonomy_categories_last_modified_by_fkey;

ALTER TABLE taxonomy_categories
    ALTER COLUMN created_by       TYPE VARCHAR(255) USING created_by::VARCHAR,
    ALTER COLUMN last_modified_by TYPE VARCHAR(255) USING last_modified_by::VARCHAR;

-- classifications: drop FK constraint + change type
ALTER TABLE classifications
    DROP CONSTRAINT IF EXISTS classifications_created_by_fkey,
    DROP CONSTRAINT IF EXISTS classifications_last_modified_by_fkey;

ALTER TABLE classifications
    ALTER COLUMN created_by       TYPE VARCHAR(255) USING created_by::VARCHAR,
    ALTER COLUMN last_modified_by TYPE VARCHAR(255) USING last_modified_by::VARCHAR;
