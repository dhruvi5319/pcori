## Screen-05: Taxonomy (`/taxonomy`)

**Purpose:** Browse, search, and manage the PCORI/ICD-10 taxonomy hierarchy
**User Stories:** US-2.1 (Add), US-2.2 (Browse), US-2.3 (Edit), US-2.4 (Deactivate), US-2.5 (Search)
**Journey:** JRN-03.1

### Layout (Two-Pane)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Taxonomy │ ...   [🔔] [Priya ▾]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Taxonomy Management        [+ Add Category]  [Search: __________ ]  │
│                                                                       │
│  ┌───────────────────────────────┬─────────────────────────────────┐ │
│  │  TAXONOMY TREE (Left Pane)    │  NODE DETAIL (Right Pane)       │ │
│  │                               │                                 │ │
│  │  ▼ Primary Clinical Cond.     │  Code:     T2D-01               │ │
│  │     ▼ Type 2 Diabetes (T2D)   │  Name:     Type 2 Diabetes      │ │
│  │        ▶ Telehealth (TH)      │  Level:    1 (Category)         │ │
│  │        ▶ Shared Dec. (SDM)    │  Parent:   Primary Clinical Cond│ │
│  │        ▼ Digital Tools (DT)   │  Status:   ● Active             │ │
│  │           ● DT-01             │  Desc:     Interventions for... │ │
│  │           ● DT-02             │  Display Order: 2               │ │
│  │        ── TelehealthGen ──    │                                 │ │
│  │           (inactive, grayed)  │  Last modified by Priya Nair    │ │
│  │     ▶ Heart Failure (HF)      │  on May 20, 2026                │ │
│  │     ▶ Cancer (CA)             │                                 │ │
│  │                               │  ─────────────────────────────  │ │
│  │                               │  [Edit]  [Add Child]            │ │
│  │                               │  [Deactivate]                   │ │
│  │                               │  (shown as [Reactivate] when    │ │
│  │                               │   node is inactive)             │ │
│  │                               │                                 │ │
│  │  [Legend: ● Active ── Inactive│                                 │ │
│  └───────────────────────────────┴─────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Tree hierarchy with active/inactive distinction | Left pane |
| Primary | Add Category CTA, Search | Page header |
| Secondary | Selected node detail and actions | Right pane |
| Tertiary | Audit trail (last modified by) | Right pane footer |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Left: skeleton tree lines; Right: skeleton form | N/A |
| Empty tree (no seed data) | "No taxonomy categories found. Seed data required." | — |
| Node selected | Node highlighted; right pane populated | — |
| Inactive node | Grayed text + "(Inactive)" suffix | — |
| After save | Tree refreshes; new/updated node highlighted briefly | Toast (green) |
| REVIEWER role | [Add Category] / [Edit] / [Deactivate] hidden | Read-only tree + detail |

### Search Results (Left Pane Overlay)

```
Search: [telehealth              ]
─────────────────────────────────
Code     │ Name             │ Level  │ Status
TH-01    │ Telehealth       │ Code   │ Active
TH-GEN   │ TelehealthGeneral│ Code   │ Inactive ──
DT-RPM   │ Remote Patient M │ Subcode│ Active
─────────────────────────────────
[☑ Active only]   "3 results"
─────────────────────────────────
[Clicking result → expands tree + scrolls to node]
```

---

## Screen-05a: Add/Edit Taxonomy Category Dialog

**Purpose:** Create or update a taxonomy node
**User Stories:** US-2.1, US-2.3

### Layout

```
┌──────────────────────────────────────────────────────┐
│  Add Taxonomy Category                           [✕] │
│                                                      │
│  Hierarchy Preview:                                  │
│  Primary Clinical Conditions > Type 2 Diabetes > [?] │
│  (updates live as parent is selected)                │
│                                                      │
│  Code *                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ RPM-01                                       │   │
│  └──────────────────────────────────────────────┘   │
│  1–50 chars, alphanumeric + hyphens                  │
│                                                      │
│  Name *                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ Remote Patient Monitoring                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Parent Category                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Type 2 Diabetes (T2D) — Level 1             ▾│   │
│  └──────────────────────────────────────────────┘   │
│  Level: 2 (auto-set = parent.level + 1)              │
│                                                      │
│  Description (optional, max 2000 chars)              │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Display Order  [0     ]                             │
│                                                      │
│  [Cancel]                     [Save Category]        │
└──────────────────────────────────────────────────────┘
```

### States

| State | Feedback |
|---|---|
| Invalid code (duplicate) | Field error: "Code already exists under this parent" |
| Invalid parent | Field error: "Parent not found or is inactive" |
| Level mismatch | Field error: "Level must be parent level + 1" |
| Circular reference | Field error: "Cannot set this parent — circular reference" |
| Success (create) | Toast: "Category added"; tree refreshes with new node highlighted |
| Success (edit) | Toast: "Category updated"; tree node label updates |

---
