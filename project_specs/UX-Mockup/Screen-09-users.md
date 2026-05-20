## Screen-09: Users (`/users`) — Admin Only

**Purpose:** Provision, manage, and deactivate user accounts and roles
**User Stories:** US-6.1 (Provision), US-6.2 (Search/View), US-6.3 (Edit), US-6.4 (Deactivate)
**Journey:** JRN-04.1, JRN-04.2

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Users │ ...       [🔔] [Tom ▾] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Management                                [+ Add User]         │
│                                                                       │
│  SEARCH & FILTER BAR                                                  │
│  Search: [                          ]  Role: [All ▾]  Status: [All ▾]│
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Username    │ Email              │ Full Name   │ Roles    │ Status │
│  │ (+ badges)  │                    │             │          │        │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ m.okonkwo   │ maya@pcori.org     │ Maya Okonkwo│ Reviewer │ ● Active│
│  │             │                    │             │          │ [Email Unverified]│
│  │ d.reyes     │ david@pcori.org    │ David Reyes │ Manager  │ ● Active│
│  │ p.nair      │ priya@pcori.org    │ Priya Nair  │ Tax.Admin│ ● Active│
│  │ t.schaefer  │ tom@pcori.org      │ Tom Schaefer│ Admin    │ ● Active│
│  │ marcus_b    │ marcus@pcori.org   │ Marcus Brown│ Reviewer │ ── Inactive│
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Additional columns (horizontal scroll): Last Login │ Created │ Actions│
│  Actions per row: [View] [Edit] [Deactivate / Reactivate]            │
│                                                                        │
│  Pagination: [← Prev]  Page 1 of 2  [Next →]   [25 ▾] per page      │
│                                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Status Visual Treatment

| Status | Row Appearance | Badge |
|---|---|---|
| Active + Verified | Normal weight text; green dot | "Active" |
| Active + Unverified | Normal text; amber badge | "Email Unverified" |
| Inactive | Grayed out row text; gray | "Inactive" |

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Add User CTA, Search | Page header |
| Primary | Username, email, roles, status | Table core columns |
| Secondary | Last login, created date | Table (secondary columns) |
| Tertiary | Action buttons | Row-level |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Skeleton table rows | N/A |
| Empty (no users) | "No users found" | — |
| No search results | "No users match '[query]'" | — |
| Inactive user row | Grayed text + "Inactive" badge | — |

---

## Screen-09a: Add User Dialog

**Purpose:** Provision a new user account with roles
**User Stories:** US-6.1

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Add User                                                [✕] │
│                                                              │
│  Username *                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│  3–50 characters, letters, numbers, and underscores          │
│                                                              │
│  Email *                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  First Name *         Last Name *                            │
│  ┌───────────────┐    ┌───────────────────────────────┐     │
│  └───────────────┘    └───────────────────────────────┘     │
│                                                              │
│  Password *                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│  8–128 chars · Must include uppercase, lowercase, digit      │
│                                                              │
│  Roles * (select at least one)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ☑ Reviewer — can upload plans and submit classif.    │   │
│  │ ☐ Manager — dashboard, analytics, and reports        │   │
│  │ ☐ Taxonomy Admin — taxonomy CRUD                     │   │
│  │ ☐ Admin — full access including user management      │   │
│  │ ☐ Viewer — read-only: dashboard and reports          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]                             [Create User]          │
│  A verification email will be sent immediately               │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen-09b: Deactivate User Confirmation Dialog

**Purpose:** Confirm deactivation with clear explanation of consequences
**User Stories:** US-6.4

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Deactivate Account: marcus_b                        [✕] │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Marcus Brown's account will be deactivated.      │   │
│  │                                                  │   │
│  │ He will no longer be able to log in.             │   │
│  │                                                  │   │
│  │ All classification records associated with       │   │
│  │ this account will remain intact.                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Cancel]                          [Deactivate]          │
│                                    (destructive: red btn) │
└──────────────────────────────────────────────────────────┘
```

---
