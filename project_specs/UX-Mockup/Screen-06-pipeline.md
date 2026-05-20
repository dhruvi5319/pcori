## Screen-06: Data Pipeline (`/data-pipeline`)

**Purpose:** Operational monitoring and control of the classification pipeline
**User Stories:** US-4.1 (Status/Health), US-4.2 (Control), US-4.3 (Stage Retry), US-4.4 (Logs/History), US-4.5 (Manual Sync)
**Journey:** JRN-02.1 Stage 2

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard │ Classifications │ Pipeline │ ...  [🔔] [Tom ▾]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Data Pipeline                                                        │
│                                                                       │
│  ── PIPELINE STATUS HEADER ────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ● RUNNING              Active Runs: 1    Queue Depth: 8       │  │
│  │  Last sync: 4 min ago   Stuck Records: 0                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ─ ─ STUCK RECORDS WARNING (shown when stuckCount > 0) ─ ─ ─ ─ ─   │
│  [⚠ 2 records stuck in PROCESSING beyond 15 minutes]                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                       │
│  ── CONTROL ACTIONS (ADMIN role only) ─────────────────────────────  │
│  [Start]  [Stop]  [Pause]  [Resume]  [Sync Now]                      │
│   (buttons contextually enabled/disabled per pipeline state)          │
│                                                                       │
│  ── STAGE CARDS ────────────────────────────────────────────────────  │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────┐  │
│  │  EXTRACT           │ │  CLASSIFY          │ │  PERSIST         │  │
│  │  ● RUNNING         │ │  ● IDLE            │ │  ● IDLE          │  │
│  │  Last run: 09:41   │ │  Last run: 09:38   │ │  Last run: 09:35 │  │
│  │  Duration: 1,243ms │ │  Duration: 4,821ms │ │  Duration: 312ms │  │
│  └────────────────────┘ └────────────────────┘ └──────────────────┘  │
│                                                                       │
│  ─ ─ FAILED STAGE CARD example ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CLASSIFY                                                       │  │
│  │  ● FAILED            Last run: 09:25   Duration: 320ms          │  │
│  │  Error: "Connection timeout to ML provider after 30s"           │  │
│  │                                                  [Retry Stage]  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ── DB HEALTH PANEL ────────────────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Connections:  Active: 5 / Max: 20    Idle: 15                 │  │
│  │  Queue Depth:  8 pending records                               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ── PIPELINE EVENT LOG ────────────────────────  [▼ Expand / ▲ Collapse] │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ [Geist Mono font]                                              │  │
│  │ 09:42:15  INFO   Pipeline run started: run-a1b2c3              │  │
│  │ 09:42:16  INFO   EXTRACT stage: processing RP-2026-043         │  │
│  │ 09:41:55  WARN   Text quality gate: low char count (92)        │  │
│  │ 09:41:12  ERROR  CLASSIFY stage failed: timeout                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Load more logs]   Page 1 / 8                                        │
│                                                                       │
│  ── RUN HISTORY TAB ────────────────────────────────────────────────  │
│  Run ID      │ Started    │ Completed  │ Status  │ Processed │ Failed │
│  run-a1b2c3  │ 09:42      │ ---        │ RUNNING │ 3         │ 0      │
│  run-a1b2c2  │ 08:31      │ 08:47      │ DONE    │ 12        │ 1      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Pipeline state indicator + stuck records warning | Status header |
| Primary | Stage cards (state + retry if FAILED) | Center |
| Secondary | Control actions (ADMIN only) | Below header |
| Secondary | DB health panel | Below stages |
| Tertiary | Event log (collapsible) + run history | Bottom |

### States

| State | Appearance | Feedback |
|---|---|---|
| Loading | Skeleton cards for stages + status | N/A |
| RUNNING | Green indicator dot + "RUNNING" text; polling 10s | N/A |
| PAUSED | Amber indicator + "PAUSED"; [Resume] enabled | — |
| STOPPED | Gray indicator + "STOPPED"; [Start] enabled | — |
| FAILED stage | Red card + error message + [Retry Stage] button | — |
| Stuck records | Amber warning callout above control bar | — |
| MANAGER role | Control buttons hidden; Retry buttons hidden | Read-only view |

### Log Level Color Coding

| Level | Color | Text |
|---|---|---|
| INFO | Gray/muted | Standard |
| WARN | Amber | Warning |
| ERROR | Red | Error |

---
