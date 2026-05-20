## Flow-06: User Management (US-6.1 – US-6.4)

**User Stories:** US-6.1 (Provision User), US-6.2 (View/Search), US-6.3 (Edit), US-6.4 (Deactivate)
**Journey:** JRN-04.1 (Provision New User), JRN-04.2 (Deactivate Departing User)

---

### Flow 6-A: Provision a New User Account (US-6.1)

**Trigger:** Admin clicks "Add User" on `/users`
**Exit:** User created; verification email sent; user visible in list with "Email Unverified" badge

```
[/users → "Add User" button]
     │
     └── AddUserDialog opens
              │
              ├── Form fields:
              │        ├── Username (3–50 chars, alphanumeric + underscore)
              │        ├── Email (RFC 5322)
              │        ├── Password (8–128 chars, complexity rules shown)
              │        ├── First Name
              │        ├── Last Name
              │        └── Roles (multi-select with descriptions):
              │                 ☑ Reviewer — can upload plans and submit classifications
              │                 ☐ Manager — dashboard, analytics, and reports
              │                 ☐ Taxonomy Admin — taxonomy CRUD
              │                 ☐ Admin — full access including user management
              │                 ☐ Viewer — read-only dashboard and reports
              │
              └── [Create User] button (disabled until all required fields valid)
                       │
                       └── POST /api/users
                                │
                                ├── 409 USERNAME_TAKEN → field error
                                ├── 409 EMAIL_TAKEN → field error
                                ├── 400 INVALID_ROLE → field error
                                │
                                └── 201 Created
                                         ├── Toast (green): "Account created —
                                         │                   Verification email sent
                                         │                   to [email]"
                                         ├── Dialog closes
                                         └── User appears in list:
                                                  Status: Active
                                                  Badge: "Email Unverified" (amber)
```

---

### Flow 6-B: View and Search Users (US-6.2)

**Trigger:** Admin navigates to `/users`
**Exit:** Filtered user list displayed; admin can take action on any row

```
[/users page loads]
     │
     ├── GET /api/users (default: all, sorted createdAt DESC, 25/page)
     │
     ├── Search / Filter bar:
     │        ├── Keyword search (username, email, full name)
     │        ├── Role filter dropdown
     │        └── Status filter: All | Active | Inactive
     │
     ├── Loading: table row skeletons
     │
     └── Table columns:
              Username | Email | Full Name | Roles | Status | Last Login | Created | Actions
              │
              ├── Active user: green dot + "Active"
              ├── Inactive user: gray row + "Inactive" badge
              └── Email Unverified: amber "Email Unverified" badge
```

---

### Flow 6-C: Edit User Details and Roles (US-6.3)

**Trigger:** Admin clicks "Edit" from user row action menu
**Exit:** Updated user; toast confirmation; audit trail updated

```
[User row → action menu → Edit]
     │
     └── EditUserDialog (pre-populated):
              ├── First Name (editable)
              ├── Last Name (editable)
              ├── Phone Number (editable, optional)
              ├── Roles (multi-select — replaces current role set)
              ├── Username: [read-only, shown for reference]
              ├── Email: [read-only, shown for reference]
              │
              └── [Save Changes]
                       └── PUT /api/users/{id}
                                └── 200 OK → Toast (green): "User updated"
```

---

### Flow 6-D: Deactivate a User Account (US-6.4)

**Trigger:** Admin clicks "Deactivate" from user row action menu or from user detail
**Exit:** User status → Inactive; row grayed; access immediately revoked

```
[User row → action menu → Deactivate]
     │
     └── ConfirmationDialog:
              "Deactivate [username]'s account?"
              ──────────────────────────────────────────────────────
              "[Full Name]'s account will be deactivated.
              They will no longer be able to log in.
              All classification records associated with
              their account will remain intact."
              ──────────────────────────────────────────────────────
              [Cancel]  [Deactivate]
              │
              └── PATCH /api/users/{id}/status  { isActive: false }
                       │
                       ├── 400 SELF_DEACTIVATION
                       │        └── Toast (amber): "You cannot deactivate your own account"
                       │
                       └── 200 OK
                                ├── Toast (amber): "[username] deactivated"
                                ├── Row grayed out + "Inactive" badge
                                ├── Active sessions invalidated immediately
                                └── Detail pane shows:
                                         "Deactivated by [admin] on [date/time]"

Reactivation:
[Inactive user → action menu → Reactivate]
     └── PATCH /api/users/{id}/status  { isActive: true }
              └── 200 OK → Toast (green): "[username] reactivated"
                           Row returns to active state
```

---
