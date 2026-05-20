---

## F02: Taxonomy Management
*Maps to FR-3 | Priority: P0 | Phase: 2 | Depends on: F00*

**Description:** Taxonomy Administrators maintain the PCORI/ICD-10 taxonomy as the single source of truth for classification targets. The taxonomy is a self-referential JPA entity tree. Taxonomy codes are never hard-deleted — activate/deactivate preserves historical classification references while removing codes from future classification targets. The taxonomy must be seeded via Flyway repeatable migration before the classification pipeline can produce meaningful results. The full hierarchical tree is exposed via a dedicated endpoint consumed by the two-pane admin UI.

---

### Terminology

- **TaxonomyCategory:** Single node in the taxonomy tree (can be PCC, category, code, or subcode level depending on `level` field).
- **Parent-child hierarchy:** Self-referential FK `parent_id → taxonomy_categories.id`; root nodes have `parent_id = NULL`.
- **Level:** Integer (0=root/PCC, 1=category, 2=code, 3=subcode); used for UI rendering and validation.
- **Display order:** Integer per sibling group controlling sort order in tree view.
- **Activate/deactivate:** `is_active` boolean flag; deactivated codes cannot be targeted by new classifications but remain on historical records.
- **Repeatable seed migration:** Flyway `R__seed_taxonomy.sql` — re-runs on any content change; idempotent upserts.

---

### Sub-features

- FR-3.1 — Full CRUD on taxonomy categories (code, name, description, level, displayOrder, parentId)
- FR-3.2 — Parent-child hierarchy (self-referential); tree and children endpoints
- FR-3.3 — Activate/deactivate without deletion; soft lifecycle
- FR-3.4 — Search by code, name, or description text
- FR-3.5 — Full hierarchical tree view (`GET /api/taxonomy/tree`) and children of a node (`GET /api/taxonomy/{id}/children`)

---

### Process

#### FR-3.1 — CRUD

**Create:**
1. Admin `POST /api/taxonomy` with `{code, name, description, parentId?, level, displayOrder}`.
2. System validates `code` unique within sibling group (same parent).
3. If `parentId` provided: validate parent exists and is active.
4. System creates `TaxonomyCategory` record with `isActive=true`.
5. Returns `201 Created` with full entity.

**Read (single):**
1. `GET /api/taxonomy/{id}` — returns single category with parent reference.
2. `GET /api/taxonomy/code/{code}` — lookup by code string.

**Update:**
1. Admin `PUT /api/taxonomy/{id}` with updatable fields.
2. System validates code uniqueness if code changed.
3. Cannot change `parentId` to create circular reference.
4. Returns `200 OK` with updated entity.

**Delete:**
- Taxonomy categories are **never hard-deleted**.
- If a "delete" action is triggered, system deactivates (`is_active=false`) instead.
- `DELETE /api/taxonomy/{id}` → behaves as deactivate, returns `200 OK` with deactivated entity.
- Reason: historical `Classification` records reference taxonomy codes; hard-delete breaks referential integrity.

#### FR-3.2 — Tree and Children

**Tree:**
1. `GET /api/taxonomy/tree` — returns entire tree as nested JSON structure.
2. Root nodes (level=0, `parent_id IS NULL`) at top level; children nested recursively.
3. Ordered by `display_order` within each sibling group.
4. Response includes `children` array on each node.
5. Large taxonomy trees (>500 nodes): lazy loading per subtree acceptable in v2; v1 returns full tree.

**Children:**
1. `GET /api/taxonomy/{id}/children` — returns direct children of the specified node.
2. Returns flat list ordered by `display_order`.

#### FR-3.3 — Activate/Deactivate
1. Admin `PATCH /api/taxonomy/{id}/status` with `{isActive: true/false}`.
2. Deactivating a parent also deactivates all descendants (cascading deactivation).
3. Activated nodes: only if parent is also active.
4. Returns updated entity.

#### FR-3.4 — Search
1. `GET /api/taxonomy/search?q={term}` — full-text search on `code`, `name`, `description`.
2. Returns flat list of matching categories (all levels), ordered by relevance.
3. Supports `activeOnly=true` query param (default true) to filter inactive.

#### FR-3.5 — Active Codes List
1. `GET /api/taxonomy/active` — returns all active categories as flat list.
2. Used by classification override dropdown and keyword classifier initialization.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `code` | string | yes (create) | 1–50 chars; alphanumeric + hyphens; unique within parent |
| `name` | string | yes (create) | 1–255 chars |
| `description` | string | no | Max 2000 chars |
| `parentId` | UUID | no | Must reference existing active category; null for root |
| `level` | integer | yes (create) | 0–3; must be parent.level + 1 if parent provided |
| `displayOrder` | integer | no | Default 0; used for sibling sort order |
| `isActive` | boolean | yes (status) | `true` or `false` |
| `q` | string | yes (search) | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Category created | `201 Created` | Full `TaxonomyCategory` object |
| Category retrieved | `200 OK` | Full `TaxonomyCategory` object with parent ref |
| Tree retrieved | `200 OK` | Nested tree structure (root nodes with `children` arrays) |
| Children retrieved | `200 OK` | Flat list of direct children |
| Category updated | `200 OK` | Updated `TaxonomyCategory` object |
| Status toggled | `200 OK` | Updated entity with new `isActive` |
| Search results | `200 OK` | `{content: [...], totalElements}` |
| Active list | `200 OK` | Array of active `TaxonomyCategory` objects |
| Not found | `404 Not Found` | Error response |

---

### Validation Rules

- `code` must be unique among siblings (same `parent_id`). Duplicate codes at different levels are allowed.
- `level` must equal `parent.level + 1` when `parentId` is provided; root nodes must have `level=0`.
- Circular references: system must reject a `parentId` update that would create a cycle (a node cannot be its own ancestor).
- Cascading deactivation: deactivating a node deactivates all descendant nodes in the same transaction.
- Activation constraint: a node can only be activated if its parent is also active (root nodes excepted).
- Active codes only for classification: `ClassificationStrategy` must only target `is_active=true` categories.
- `@SQLRestriction("deleted_at IS NULL")` applied to entity; soft-delete of taxonomy categories sets `deleted_at` (admin hard-delete path, not routinely used).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Category not found | `404 Not Found` | `NOT_FOUND` | "Taxonomy category {id} not found" |
| Duplicate code in sibling group | `409 Conflict` | `CODE_DUPLICATE` | "Code '{code}' already exists under this parent" |
| Invalid parent (not found/inactive) | `400 Bad Request` | `INVALID_PARENT` | "Parent category not found or inactive" |
| Level mismatch | `400 Bad Request` | `INVALID_LEVEL` | "Level must be parent level + 1" |
| Circular reference | `400 Bad Request` | `CIRCULAR_REFERENCE` | "Cannot set parent: would create circular reference" |
| Activate with inactive parent | `400 Bad Request` | `INACTIVE_PARENT` | "Cannot activate: parent category is inactive" |

---

### API Surface (this feature)
See `Y1-api.md` §Taxonomy for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/taxonomy` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/tree` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/{id}` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/code/{code}` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/{id}/children` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/search` | JWT | `REVIEWER` |
| `GET` | `/api/taxonomy/active` | JWT | `REVIEWER` |
| `POST` | `/api/taxonomy` | JWT | `TAXONOMY_ADMIN` |
| `PUT` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` |
| `DELETE` | `/api/taxonomy/{id}` | JWT | `TAXONOMY_ADMIN` |
| `PATCH` | `/api/taxonomy/{id}/status` | JWT | `TAXONOMY_ADMIN` |

---

### Schema Surface (this feature)
Uses table: `taxonomy_categories` — see `Y0-schema.md` §Taxonomy.

Key fields:
- `taxonomy_categories.code` — varchar(50); unique within parent
- `taxonomy_categories.parent_id` — self-referential FK to `taxonomy_categories.id`; nullable (root)
- `taxonomy_categories.level` — integer (0–3)
- `taxonomy_categories.is_active` — boolean; default true
- `taxonomy_categories.display_order` — integer; default 0

Seed data: loaded via Flyway repeatable migration `R__seed_taxonomy.sql` (upsert on `code`; re-runs on change).
