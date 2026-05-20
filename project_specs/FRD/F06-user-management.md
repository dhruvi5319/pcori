---

## F06: User Management (Admin)
*Maps to FR-7 | Priority: P0 | Phase: 1 + 4 | Depends on: F00*

**Description:** System Administrators provision, manage, and deactivate user accounts without IT intervention. Role assignment is done through the admin UI, tied to the backend `Role` entity. Accounts are deactivated (not hard-deleted) to preserve audit trail integrity — every classification record references `uploadedBy` / `reviewedBy` and those foreign keys must remain valid.

---

### Terminology

- **Deactivation:** Setting `is_active=false` on a user account; the user cannot log in; their historical records are preserved.
- **Hard-delete:** Explicitly **prohibited** for user accounts; would break FK references on `classifications.uploaded_by` and `classifications.reviewed_by`.
- **Role assignment:** Assigning one or more `Role` entities to a user via `user_roles` join table; admin UI shows multi-select.
- **Email verification enforcement:** Admin-created accounts must complete email verification before the user can log in with real data.

---

### Sub-features

- FR-7.1 — CRUD user accounts; assign roles
- FR-7.2 — Toggle active/inactive status (deactivate/reactivate)
- FR-7.3 — Search and filter users

---

### Process

#### FR-7.1 — Create User
1. Admin `POST /api/users` with `{username, email, password, firstName, lastName, roles: [roleId, ...]}`.
2. System validates: username unique, email unique, password complexity.
3. BCrypt hash password.
4. Create `User` record with `isActive=true`, `isEmailVerified=false`.
5. Assign roles via `user_roles`.
6. Send verification email.
7. Returns `201 Created` with sanitized user object (no password hash).

#### FR-7.1 — Read Users
- `GET /api/users` — paginated list (default page size 25).
- `GET /api/users/{id}` — single user detail with roles.
- `GET /api/users/active` — list of active users only.
- `GET /api/users/search?q={term}&role={roleId}&status={active|inactive}` — search by username, email, name.

#### FR-7.1 — Update User
1. Admin `PUT /api/users/{id}` with updatable fields: `firstName`, `lastName`, `phoneNumber`, `roles`.
2. Cannot change `username` or `email` via this endpoint (separate dedicated flows if needed).
3. Role update: replaces existing role assignments with new set.
4. Returns `200 OK` with updated user object.

#### FR-7.1 — Delete (Deactivate)
- `DELETE /api/users/{id}` → **behaves as deactivation** (not hard-delete).
- Sets `is_active=false`.
- User cannot log in after deactivation.
- All historical records preserved.
- Returns `200 OK` with deactivated user.

#### FR-7.2 — Toggle Status
1. Admin `PATCH /api/users/{id}/status` with `{isActive: true/false}`.
2. Deactivating: sets `is_active=false`; any active refresh tokens invalidated.
3. Reactivating: sets `is_active=true`; user can log in again.
4. Cannot deactivate own account (prevent accidental lockout).
5. Returns `200 OK` with updated user.

#### FR-7.3 — Search and Filter
- `GET /api/users/search?q={}&role={roleId}&status={active|inactive}&page={}&size={}`.
- `q` searches: username, email, firstName + lastName concatenated.
- `role` filter: by role ID.
- `status` filter: `active` = `is_active=true`; `inactive` = `is_active=false`.
- Default sort: `createdAt DESC`.
- Paginated; default page size 25.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes (create) | 3–50 chars; alphanumeric + underscore; unique |
| `email` | string | yes (create) | RFC 5322; max 255 chars; unique |
| `password` | string | yes (create) | 8–128 chars; complexity rules |
| `firstName` | string | yes (create) | 1–100 chars |
| `lastName` | string | yes (create) | 1–100 chars |
| `phoneNumber` | string | no | Max 20 chars |
| `roles` | UUID array | yes (create) | At least one valid `Role.id`; `400` if role not found |
| `isActive` | boolean | yes (status) | `true` or `false` |
| `q` (search) | string | no | 1–100 chars |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| User created | `201 Created` | User object (no password; includes roles) |
| User retrieved | `200 OK` | User object with roles and last login |
| User list | `200 OK` | `{content: [...], page, size, totalElements}` |
| User updated | `200 OK` | Updated user object |
| User deactivated | `200 OK` | Updated user with `isActive: false` |
| Status toggled | `200 OK` | Updated user |
| Search results | `200 OK` | Paginated user list |

---

### Validation Rules

- `username` unique across all users (active and inactive). `409 USERNAME_TAKEN`.
- `email` unique across all users (active and inactive). `409 EMAIL_TAKEN`.
- Password complexity: 8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit.
- `roles`: must reference existing `Role` records; `400 INVALID_ROLE` if not found.
- Cannot deactivate own account: `400 SELF_DEACTIVATION`.
- Hard-delete forbidden: `DELETE /api/users/{id}` must deactivate, never drop the row.
- Role assignment: UI shows multi-select bound to available `Role` entities; roles seeded via Flyway.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Username already taken | `409 Conflict` | `USERNAME_TAKEN` | "Username already in use" |
| Email already registered | `409 Conflict` | `EMAIL_TAKEN` | "Email already registered" |
| User not found | `404 Not Found` | `NOT_FOUND` | "User {id} not found" |
| Invalid role ID | `400 Bad Request` | `INVALID_ROLE` | "Role {id} not found" |
| Self-deactivation | `400 Bad Request` | `SELF_DEACTIVATION` | "Cannot deactivate your own account" |
| Insufficient permissions | `403 Forbidden` | `ACCESS_DENIED` | "User management requires ADMIN role" |

---

### API Surface (this feature)
See `Y1-api.md` §Users for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/users` | JWT | `ADMIN` |
| `GET` | `/api/users/{id}` | JWT | `ADMIN` |
| `POST` | `/api/users` | JWT | `ADMIN` |
| `PUT` | `/api/users/{id}` | JWT | `ADMIN` |
| `DELETE` | `/api/users/{id}` | JWT | `ADMIN` |
| `PATCH` | `/api/users/{id}/status` | JWT | `ADMIN` |
| `GET` | `/api/users/search` | JWT | `ADMIN` |
| `GET` | `/api/users/active` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Uses tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions` — see `Y0-schema.md` §Auth.

Key fields:
- `users.is_active` — boolean; toggled by admin
- `users.is_email_verified` — boolean; must be true before login
- `user_roles.user_id` + `user_roles.role_id` — join table; replaced on role update
