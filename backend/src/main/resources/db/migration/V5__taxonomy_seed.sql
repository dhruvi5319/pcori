-- ============================================================
-- V5__taxonomy_seed.sql
-- taxonomy_categories DDL + PCORI starter seed data
-- ============================================================

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
    created_by       VARCHAR(255),
    last_modified_by VARCHAR(255),
    deleted_at       TIMESTAMPTZ,
    UNIQUE (code, parent_id)
);

CREATE INDEX idx_taxonomy_code   ON taxonomy_categories(code)      WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_parent ON taxonomy_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_active ON taxonomy_categories(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxonomy_level  ON taxonomy_categories(level)     WHERE deleted_at IS NULL AND is_active = TRUE;

ALTER TABLE taxonomy_categories ADD COLUMN search_vector TSVECTOR
    GENERATED ALWAYS AS (
        to_tsvector('english',
            COALESCE(code, '') || ' ' ||
            COALESCE(name, '') || ' ' ||
            COALESCE(description, ''))
    ) STORED;
CREATE INDEX idx_taxonomy_fts ON taxonomy_categories USING GIN(search_vector);

-- PCORI Primary Clinical Conditions (PCC) — level 0 root nodes
INSERT INTO taxonomy_categories (id, code, name, description, parent_id, is_active, level, display_order)
VALUES
  (gen_random_uuid(), 'DIABETES',      'Type 2 Diabetes',             'Research plans focused on Type 2 Diabetes management and outcomes',    NULL, TRUE, 0, 1),
  (gen_random_uuid(), 'CARDIOVASCULAR','Cardiovascular Disease',       'Heart failure, coronary artery disease, hypertension research',        NULL, TRUE, 0, 2),
  (gen_random_uuid(), 'CANCER',        'Cancer',                      'Oncology research including prevention, treatment, and survivorship',   NULL, TRUE, 0, 3),
  (gen_random_uuid(), 'MENTAL_HEALTH', 'Mental and Behavioral Health', 'Depression, anxiety, substance use disorder research',                 NULL, TRUE, 0, 4),
  (gen_random_uuid(), 'PAIN',          'Pain Management',             'Chronic pain, opioid alternatives, pain outcomes research',             NULL, TRUE, 0, 5),
  (gen_random_uuid(), 'RESPIRATORY',   'Respiratory Disease',         'COPD, asthma, pulmonary disease research',                             NULL, TRUE, 0, 6),
  (gen_random_uuid(), 'OBESITY',       'Obesity and Weight Management','Weight loss interventions and metabolic syndrome research',            NULL, TRUE, 0, 7),
  (gen_random_uuid(), 'RARE_DISEASE',  'Rare Diseases',               'Research on conditions affecting fewer than 200,000 people',           NULL, TRUE, 0, 8),
  (gen_random_uuid(), 'PEDIATRIC',     'Pediatric Health',            'Child and adolescent health outcomes research',                        NULL, TRUE, 0, 9),
  (gen_random_uuid(), 'AGING',         'Aging and Dementia',          'Alzheimer''s disease, dementia, and healthy aging research',           NULL, TRUE, 0, 10)
ON CONFLICT DO NOTHING;
