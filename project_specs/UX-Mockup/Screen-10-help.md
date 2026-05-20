## Screen-10: Help Center (`/help`)

**Purpose:** In-platform self-service documentation and FAQs
**User Stories:** US-8.1 (Browse), US-8.2 (Search), US-8.3 (FAQ), US-8.4 (Feedback)

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ ... │ Help   [🔔] [Maya ▾]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Help Center                  [Search articles...              🔍]   │
│                                                                       │
│  ┌─────────────────────────┬─────────────────────────────────────┐   │
│  │  SIDEBAR — Categories   │  MAIN CONTENT AREA                  │   │
│  │                         │                                     │   │
│  │  Getting Started        │  How to Upload a Research Plan      │   │
│  │  ▶ How to upload a plan │  Category: Getting Started          │   │
│  │  ▶ Understanding results│  Published: May 1, 2026             │   │
│  │  ▶ User roles guide     │  ─────────────────────────────────  │   │
│  │                         │                                     │   │
│  │  Classification         │  [Rendered Markdown content]        │   │
│  │  ▶ AI confidence guide  │                                     │   │
│  │  ▶ Override how-to      │  Uploading your first PDF research  │   │
│  │  ▶ Status reference     │  plan is straightforward. Navigate  │   │
│  │                         │  to Classifications and click...    │   │
│  │  Reports                │                                     │   │
│  │  ▶ Excel export guide   │  [Full article content continues]   │   │
│  │  ▶ Ad-hoc builder       │                                     │   │
│  │                         │  ─────────────────────────────────  │   │
│  │  Taxonomy               │  Was this helpful?                  │   │
│  │  ▶ Managing taxonomy    │  [👍 Yes]   [👎 No]                 │   │
│  │  ▶ Deactivating codes   │                                     │   │
│  │                         │  ─────────────────────────────────  │   │
│  │  ─────────────────────  │                                     │   │
│  │  FAQ                    │  FAQ                                │   │
│  │  ─────────────────────  │                                     │   │
│  │  (scrolls to FAQ section│  Getting Started ▼                  │   │
│  │   in main area)         │  ▼ How long does classification take?   │
│  │                         │     Classifications typically       │   │
│  │                         │     complete within 2–5 minutes... │   │
│  │                         │  ▶ What file types are supported?  │   │
│  │                         │  ▶ What does NEEDS_REVIEW mean?    │   │
│  │                         │                                     │   │
│  │                         │  Classification ▶                   │   │
│  └─────────────────────────┴─────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Search bar (fastest path to answer) | Page header |
| Primary | Article content | Main area |
| Secondary | Category sidebar navigation | Left pane |
| Secondary | FAQ accordion | Main area (below articles) |
| Tertiary | Feedback widget | Article footer |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading (article list) | Skeleton sidebar links | N/A |
| Loading (article content) | Skeleton paragraphs in main area | N/A |
| Article not found | "Article not found" + [Browse all articles] | — |
| Search < 2 chars | Inline: "Type at least 2 characters" | — |
| Search: no results | "No articles found for '[query]'" + [Contact Support] link | — |
| Feedback submitted | "✓ Thank you for your feedback!" replaces widget | — |
| FAQ loading | Skeleton accordion items | N/A |

### Search Results Overlay

```
Search: [telehealth management        ]
─────────────────────────────────────────
Telehealth & Digital Interventions — Classification
  Category: Classification
  "...for telehealth interventions, the system maps..."

Managing Taxonomy Codes — Taxonomy
  Category: Taxonomy
  "...telehealth codes are organized under the..."
─────────────────────────────────────────
2 results for "telehealth management"
```

### Feedback Widget States

```
Default:
  Was this helpful?  [👍 Yes]  [👎 No]

After clicking Yes or No:
  Was this helpful?  [👍 Yes ✓]  [👎 No]
  Optional: Add a comment (max 1000 chars)
  [                                    ]
  [Submit Feedback]  ← optional; auto-submits on click if no comment

After submission:
  ✓ Thank you for your feedback!
```

---
