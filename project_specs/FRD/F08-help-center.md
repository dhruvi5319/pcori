---

## F08: Help Center
*Maps to FR-9 | Priority: P2 | Phase: 4 | Depends on: F00*

**Description:** Provides in-platform documentation and FAQs so reviewers can self-serve answers without contacting support. Help Center content cannot be authored until the system is built; it ships in Phase 4 after the core workflow is stable. A documentation feedback widget closes the loop on article quality. Articles are stored as Markdown content in the `HelpArticle` entity and rendered in the frontend.

---

### Terminology

- **HelpArticle:** Entity containing: title, slug (URL-friendly identifier), category, content (Markdown), publishedAt.
- **FAQ:** Entity containing: question, answer, category, displayOrder.
- **DocumentationFeedback:** Per-article, per-user feedback: helpful (boolean) + optional comment.
- **Slug:** URL-friendly article identifier (e.g., `how-to-upload-a-plan`); unique; used for routing.
- **Article category:** Grouping label used in sidebar navigation (e.g., "Getting Started", "Classification", "Reports").

---

### Sub-features

- FR-9.1 — Browse help articles by category (sidebar navigation); article content rendered from Markdown
- FR-9.1 — FAQ accordion by category
- FR-9.1 — Searchable article index
- FR-9.2 — "Was this helpful?" feedback widget (per article, per user)

---

### Process

#### FR-9.1 — Browse Articles
1. `GET /api/help/articles` — returns list of articles with title, slug, category, publishedAt (no full content for list).
2. `GET /api/help/articles/{slug}` — returns full article including Markdown content.
3. Articles grouped by `category` in sidebar navigation.
4. Frontend renders Markdown content using a Markdown renderer (e.g., `react-markdown` with sanitization).
5. Articles ordered by `publishedAt DESC` within each category.

#### FR-9.1 — Search
1. `GET /api/help/articles/search?q={term}` — full-text search on title and content.
2. Returns matching articles with snippet/highlight.
3. Empty results: show "No articles found for '{q}'" with a contact support link.

#### FR-9.1 — FAQs
1. `GET /api/help/faqs` — returns all FAQ items ordered by category and `displayOrder`.
2. `GET /api/help/faqs?category={cat}` — filter by category.
3. Frontend renders as accordion grouped by category.

#### FR-9.1 — Admin Article Management (CRUD)
1. Admin `POST /api/help/articles` — create article with `{title, slug, category, content, publishedAt?}`.
2. Admin `PUT /api/help/articles/{id}` — update article.
3. Admin `DELETE /api/help/articles/{id}` — soft-delete (sets `deleted_at`).
4. Admin `POST /api/help/faqs` / `PUT` / `DELETE` — CRUD on FAQ items.

#### FR-9.2 — Documentation Feedback
1. `POST /api/help/feedback` with `{articleId, helpful: boolean, comment?}`.
2. System stores `DocumentationFeedback` with `userId=currentUser`, `submittedAt=now`.
3. One feedback record per user per article (upsert on duplicate).
4. Returns `201 Created` or `200 OK` (upsert).
5. Admin can retrieve feedback summary: `GET /api/help/articles/{id}/feedback` — `{helpfulCount, unhelpfulCount, comments: [...]}`.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | yes (article) | 1–255 chars |
| `slug` | string | yes (article) | 1–100 chars; lowercase alphanumeric + hyphens; unique |
| `category` | string | yes (article) | 1–100 chars |
| `content` | string | yes (article) | Markdown; max 100,000 chars |
| `publishedAt` | ISO-8601 datetime | no | Defaults to now |
| `helpful` | boolean | yes (feedback) | `true` or `false` |
| `comment` | string | no (feedback) | Max 1000 chars |
| `q` (search) | string | yes (search) | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| Article list | `200 OK` | `[{id, title, slug, category, publishedAt}]` |
| Article detail | `200 OK` | `{id, title, slug, category, content, publishedAt}` |
| Search results | `200 OK` | `[{title, slug, category, snippet}]` |
| FAQ list | `200 OK` | `[{id, question, answer, category, displayOrder}]` |
| Feedback submitted | `201 Created` / `200 OK` | `{message: "Feedback recorded"}` |
| Feedback summary (admin) | `200 OK` | `{helpfulCount, unhelpfulCount, comments: []}` |
| Article not found | `404 Not Found` | Error response |

---

### Validation Rules

- `slug` must be unique across all articles; `409 DUPLICATE_SLUG` if violated.
- Markdown content must be sanitized before rendering in frontend (prevent XSS via `rehype-sanitize` or equivalent).
- Feedback: upsert per user per article (one feedback per user per article; later submission overwrites earlier).
- Search: minimum query length 2 chars; `400 QUERY_TOO_SHORT` if shorter.
- Article management (create/update/delete): requires `ADMIN` role; read/search/feedback: any authenticated user.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Article not found by slug | `404 Not Found` | `NOT_FOUND` | "Article '{slug}' not found" |
| Duplicate slug | `409 Conflict` | `DUPLICATE_SLUG` | "Article slug already exists" |
| Search query too short | `400 Bad Request` | `QUERY_TOO_SHORT` | "Search query must be at least 2 characters" |
| Feedback article not found | `404 Not Found` | `NOT_FOUND` | "Article {id} not found" |

---

### API Surface (this feature)
See `Y1-api.md` §Help for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/help/articles` | JWT | any |
| `GET` | `/api/help/articles/{slug}` | JWT | any |
| `GET` | `/api/help/articles/search` | JWT | any |
| `POST` | `/api/help/articles` | JWT | `ADMIN` |
| `PUT` | `/api/help/articles/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/help/articles/{id}` | JWT | `ADMIN` |
| `GET` | `/api/help/faqs` | JWT | any |
| `POST` | `/api/help/faqs` | JWT | `ADMIN` |
| `PUT` | `/api/help/faqs/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/help/faqs/{id}` | JWT | `ADMIN` |
| `POST` | `/api/help/feedback` | JWT | any |
| `GET` | `/api/help/articles/{id}/feedback` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Uses tables: `help_articles`, `faqs`, `documentation_feedback` — see `Y0-schema.md` §Help.

Key fields:
- `help_articles.slug` — unique; URL routing key
- `help_articles.content` — Markdown text; `TEXT` column
- `documentation_feedback.helpful` — boolean
- `faqs.display_order` — integer for accordion sort order
