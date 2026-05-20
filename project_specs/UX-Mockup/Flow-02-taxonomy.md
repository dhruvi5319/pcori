## Flow-02: Taxonomy Management (US-2.1 – US-2.5)

**User Stories:** US-2.1 (Add Category), US-2.2 (Browse Hierarchy), US-2.3 (Edit Category), US-2.4 (Deactivate), US-2.5 (Search)
**Journey:** JRN-03.1 (Add New → Verify → Deactivate)

---

### Flow 2-A: Add a New Taxonomy Category (US-2.1)

**Trigger:** Taxonomy Admin clicks "Add Category" or "Add Child" button on `/taxonomy`
**Exit:** New node appears highlighted in tree; right pane shows its detail

```
[Taxonomy page → "Add Category" or "Add Child" (on selected node)]
     │
     └── AddCategoryDialog opens (or inline form in right pane)
              │
              ├── Form fields:
              │        ├── Code (required, 1–50 chars, alphanumeric + hyphens)
              │        ├── Name (required, 1–255 chars)
              │        ├── Description (textarea, max 2000 chars)
              │        ├── Level (auto-set to parent.level + 1 when parent selected)
              │        ├── Parent Category (tree picker or dropdown — shows active only)
              │        └── Display Order (integer, default 0)
              │
              ├── Hierarchy breadcrumb preview:
              │        "[Root PCC] > [Parent Category] > [New Code]"
              │        (updates live as parent is selected — JRN-03.1 delight)
              │
              └── User clicks "Save"
                       │
                       └── POST /api/taxonomy
                                │
                                ├── 409 CODE_DUPLICATE → field error: "Code already exists under this parent"
                                ├── 400 INVALID_LEVEL → field error: "Level must be parent level + 1"
                                ├── 400 INVALID_PARENT → field error: "Parent not found or inactive"
                                │
                                └── 201 Created
                                         ├── Toast (green): "Category added"
                                         ├── Tree refreshes instantly
                                         └── New node briefly highlighted in tree (JRN-03.1)
```

---

### Flow 2-B: Browse and Select Taxonomy Node (US-2.2)

**Trigger:** User navigates to `/taxonomy`
**Exit:** Node selected in left pane; detail shown in right pane

```
[GET /api/taxonomy/tree]
     │
     ├── Loading: left pane shows skeleton tree lines
     │
     └── Tree renders:
              │
              ├── Root nodes (level 0) expanded by default
              ├── Children nested with visual indentation
              ├── Sorted by displayOrder within sibling group
              ├── Inactive nodes: grayed out + "(Inactive)" suffix (still visible)
              │
              └── User clicks a node
                       │
                       └── Right pane shows:
                                ├── Code: [value]
                                ├── Name: [value]
                                ├── Description: [text]
                                ├── Level: [0–3]
                                ├── Parent: [parent name or "Root"]
                                ├── Status: Active / Inactive badge
                                ├── Last modified by [user] on [date]
                                └── Action buttons: [Edit] [Toggle Active] [Add Child]
```

---

### Flow 2-C: Edit a Taxonomy Category (US-2.3)

**Trigger:** User clicks "Edit" from right pane of selected node
**Exit:** Updated node in tree; success toast; audit trail updated

```
[Taxonomy detail pane → "Edit" button]
     │
     └── Edit form in right pane (inline, fields pre-populated)
              │
              ├── Editable: Name, Description, Display Order
              ├── Code can be changed (re-validated for uniqueness)
              │
              └── User clicks "Save"
                       │
                       └── PUT /api/taxonomy/{id}
                                │
                                ├── 409 CODE_DUPLICATE → field error
                                ├── 400 CIRCULAR_REFERENCE → "Cannot set this parent — circular reference"
                                │
                                └── 200 OK
                                         ├── Toast (green): "Category updated"
                                         ├── Tree node label updates immediately
                                         └── Detail pane shows updated values + new "Updated by" timestamp
```

---

### Flow 2-D: Deactivate an Obsolete Taxonomy Code (US-2.4)

**Trigger:** User selects a node and clicks "Deactivate" in the right pane
**Exit:** Node grayed in tree; code excluded from classification overrides

```
[Taxonomy detail pane → "Deactivate" button]
     │
     └── ConfirmationDialog:
              "Deactivate [Code Name]?"
              ──────────────────────────────────────────────
              "This code will be hidden from future
              classifications. Existing records that use
              it will not be affected."
              [If parent of children: "N child code(s) will
              also be deactivated."]
              ──────────────────────────────────────────────
              [Cancel]  [Deactivate]
              │
              └── PATCH /api/taxonomy/{id}/status  { isActive: false }
                       │
                       ├── 400 INACTIVE_PARENT → shown only on reactivation path
                       │
                       └── 200 OK
                                ├── Toast (green): "Code deactivated"
                                ├── Node grayed in tree + "(Inactive)" label
                                ├── All descendant nodes also grayed
                                └── Detail pane shows "Inactive" status badge
                                         + "Deactivated by [user] on [date]"
```

**Reactivation path (toggle Active):**
- Same PATCH endpoint with `{ isActive: true }`
- If parent is inactive → 400 INACTIVE_PARENT → Toast (amber): "Cannot activate — parent is inactive. Activate the parent first."

---

### Flow 2-E: Search the Taxonomy (US-2.5)

**Trigger:** User types in the taxonomy search input (left pane or search bar)
**Exit:** Results list; clicking a result navigates to that node in the tree

```
[Taxonomy search input]
     │
     ├── Debounced GET /api/taxonomy/search?q={term}&activeOnly=true
     │
     ├── Loading: spinner in search results area
     │
     ├── Results: flat list showing
     │        Code │ Name │ Level │ Parent │ Status
     │
     ├── "Active only" toggle to include inactive codes
     │
     ├── Empty state: "No taxonomy codes match '[term]'"
     │
     └── User clicks result
              └── Tree expands + scrolls to highlight the matched node
                  Right pane shows the node's details
```

---
