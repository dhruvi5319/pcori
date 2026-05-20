## Flow-08: Help Center (US-8.1 – US-8.4)

**User Stories:** US-8.1 (Browse Articles), US-8.2 (Search Articles), US-8.3 (FAQ Accordion), US-8.4 (Feedback)

---

### Flow 8-A: Browse Help Articles (US-8.1)

**Trigger:** User navigates to `/help`
**Exit:** Article content rendered; user's question answered

```
[/help page]
     │
     ├── GET /api/help/articles
     │
     └── Two-pane layout:
              │
              ├── Left sidebar: Article categories
              │        ├── Getting Started
              │        │        ├── How to upload a plan
              │        │        └── Understanding classification results
              │        ├── Classification
              │        │        └── ...
              │        ├── Reports
              │        └── ...
              │
              └── Main area (default): first article in first category
                       │
                       └── User clicks article link
                                └── GET /api/help/articles/{slug}
                                         └── Renders: Title | Category | Published date
                                                       [Markdown content]
                                                       [Feedback widget]
```

---

### Flow 8-B: Search Help Articles (US-8.2)

**Trigger:** User types in the help search box
**Exit:** Matching articles shown; user clicks to read full article

```
[Help page → Search input]
     │
     ├── Minimum 2 characters required (inline: "Type at least 2 characters")
     │
     ├── GET /api/help/articles/search?q={term}
     │
     ├── Loading: spinner in results area
     │
     ├── Results: Title | Category | Content snippet with match highlighted
     │
     ├── Empty state: "No articles found for '[term]'"
     │                 [Contact Support ↗] link
     │
     └── User clicks result → full article renders in main area
```

---

### Flow 8-C: FAQ Accordion (US-8.3)

**Trigger:** User scrolls to FAQ section on `/help` or clicks "FAQ" in sidebar
**Exit:** User finds answer; accordion item collapses when new one opens

```
[Help page → FAQs section]
     │
     └── GET /api/help/faqs
              │
              └── Accordion (Radix UI Accordion primitive — keyboard accessible):
                       │
                       ├── Category: "Getting Started"
                       │        ├── ▶ [Q1 text]
                       │        ├── ▼ [Q2 text — expanded]  ← only one open per category
                       │        │        [Answer rendered as text]
                       │        └── ▶ [Q3 text]
                       │
                       └── Category: "Classification"
                                └── ...
              │
              └── Category filter: [All ▾] dropdown narrows to one category
```

---

### Flow 8-D: Article Feedback (US-8.4)

**Trigger:** User reaches bottom of an article
**Exit:** Feedback recorded; confirmation shown

```
[Article bottom → "Was this helpful?" widget]
     │
     ├── Default state: [👍 Yes]  [👎 No]
     │
     ├── User clicks Yes or No:
     │        └── Optional comment textarea expands (max 1000 chars)
     │
     └── User clicks [Submit Feedback] (or automatic on click without comment):
              └── POST /api/help/feedback  {articleId, helpful: boolean, comment?}
                       │
                       └── 201 Created / 200 OK (upsert)
                                └── Widget replaced by:
                                         "✓ Thank you for your feedback!"
                                         (upsert: re-submitting overwrites previous response)
```

---
