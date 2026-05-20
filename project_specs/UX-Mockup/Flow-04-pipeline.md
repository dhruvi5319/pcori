## Flow-04: Pipeline Monitoring (US-4.1 – US-4.5)

**User Stories:** US-4.1 (Status/Health), US-4.2 (Control Execution), US-4.3 (Stage Retry), US-4.4 (Logs/History), US-4.5 (Manual Sync)
**Journey:** JRN-02.1 Stage 2 (Pipeline status check)

---

### Flow 4-A: View Pipeline Status and Health (US-4.1)

**Trigger:** User navigates to `/data-pipeline`
**Exit:** Status visible; polling active while pipeline running

```
[GET /api/pipeline/status]  [GET /api/pipeline/health]
     │
     ├── Loading: skeleton cards
     │
     └── Page renders:
              ├── Pipeline Status Header
              │        ├── State indicator: [● RUNNING] / [● PAUSED] / [● STOPPED]
              │        │   (colored dot + text label — never color alone)
              │        ├── Active runs: N
              │        ├── Queue depth: N pending records
              │        └── Last sync: [timestamp]
              │
              ├── Stuck Records Warning (if any):
              │        └── Amber callout: "⚠ N record(s) stuck in PROCESSING
              │                            (beyond [timeout] minutes)"
              │
              ├── Stage Cards (3 cards: EXTRACT | CLASSIFY | PERSIST)
              │        Each card shows:
              │        ├── Stage name + state (IDLE/RUNNING/PAUSED/FAILED/COMPLETED)
              │        ├── Last run: [timestamp]
              │        ├── Duration: [Nms]
              │        ├── Error: [message if FAILED]
              │        └── [Retry] button — visible ONLY when state = FAILED
              │
              ├── DB Health Panel
              │        ├── Active connections: N / Max: N
              │        ├── Idle connections: N
              │        └── Queue depth: N
              │
              └── Frontend polls GET /api/pipeline/status every 10s while any run is active
```

---

### Flow 4-B: Pipeline Control Actions (US-4.2)

**Trigger:** Admin clicks control button (Start / Stop / Pause / Resume)
**Exit:** Pipeline state indicator updates; action buttons update to reflect new state

```
Control Buttons row:
[Start]  [Stop]  [Pause]  [Resume]  [Sync Now]

Button visibility rules:
  STOPPED:  [Start] enabled; [Stop/Pause/Resume] disabled
  RUNNING:  [Stop] [Pause] enabled; [Start/Resume] disabled
  PAUSED:   [Resume] enabled; [Start/Stop/Pause] disabled

Flow per button:

[Start]
  └── POST /api/pipeline/{id}/start
           ├── 409 ALREADY_RUNNING → Toast (amber): "Pipeline already running"
           └── 202 Accepted → State: RUNNING; Toast (blue): "Pipeline started"

[Stop]
  └── Confirmation: "Stop the pipeline? In-flight stage will complete."
       [Cancel] [Stop]
           └── POST /api/pipeline/{id}/stop
                    └── 200 OK → State: STOPPED; Toast (amber): "Pipeline stopped"

[Pause]
  └── POST /api/pipeline/{id}/pause
           └── 200 OK → State: PAUSED after current stage completes
                         Toast (blue): "Pipeline will pause after current stage"

[Resume]
  └── POST /api/pipeline/{id}/resume
           ├── 400 INVALID_STATE → Toast (red): "Pipeline is not paused"
           └── 200 OK → State: RUNNING; Toast (green): "Pipeline resumed"

[All control actions require ADMIN role — button group hidden for MANAGER/VIEWER]
```

---

### Flow 4-C: Stage-Level Retry (US-4.3)

**Trigger:** Admin clicks "Retry" on a FAILED stage card
**Exit:** Stage resets to IDLE and re-queues; card updates in real time

```
[Stage Card with state = FAILED → "Retry" button]
     │
     └── Confirmation: "Retry [EXTRACT | CLASSIFY | PERSIST] stage?"
              [Cancel] [Retry]
                       │
                       └── POST /api/pipeline/{id}/stages/{stageId}/retry
                                │
                                ├── 400 INVALID_STAGE_STATE (not FAILED)
                                │        └── Toast (amber): "Stage is not in a failed state"
                                │
                                └── 202 Accepted
                                         ├── Toast (green): "Stage requeued"
                                         └── Stage card: state → IDLE (then RUNNING)
```

---

### Flow 4-D: View Pipeline Logs and Run History (US-4.4)

**Trigger:** User expands the Logs panel or clicks "Run History" tab
**Exit:** Logs visible; history entries displayed

```
Logs Panel (collapsible):
[▼ Pipeline Event Log]  [▲ Collapse]
┌──────────────────────────────────────────────────────────┐
│ [monospaced font — Geist Mono]                            │
│ 2026-05-20T09:32:15Z  INFO   Pipeline started: run-uuid  │
│ 2026-05-20T09:32:16Z  INFO   EXTRACT stage: processing   │
│ 2026-05-20T09:32:18Z  WARN   Text extraction: 82 chars   │
│ 2026-05-20T09:32:20Z  ERROR  CLASSIFY stage failed: ...  │
└──────────────────────────────────────────────────────────┘
GET /api/pipeline/{id}/logs  (paginated, 50/page)
Level color: INFO (gray) | WARN (amber) | ERROR (red)
Log entries capped at 500 chars each

Run History tab:
GET /api/pipeline/{id}/history
Table: Run ID │ Started │ Completed │ Status │ Processed │ Failed

Pipeline Stats (GET /api/pipeline/stats):
Total Runs: N  │  Total Processed: N  │  Total Failed: N  │  Avg Duration: Nms
```

---

### Flow 4-E: Manual Sync (US-4.5)

**Trigger:** Admin clicks "Sync Now" button
**Exit:** Toast shows count of queued records

```
[Control Buttons → "Sync Now"]
     │
     └── Confirmation: "Trigger manual sync to pick up pending records?"
              [Cancel] [Sync Now]
                       │
                       └── POST /api/pipeline/sync
                                │
                                ├── {queued: 0} → Toast (muted): "No pending records to sync"
                                └── {queued: N} → Toast (green): "Sync queued N record(s)"
```

---
