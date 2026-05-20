---

## F04: Pipeline Monitoring
*Maps to FR-5 | Priority: P1 | Phase: 3 | Depends on: F00, F01*

**Description:** Provides System Administrators and Program Managers with operational visibility into the classification pipeline. Surfaces stage-level health, stuck records, and run history. Control actions (start/stop/pause/resume) and stage-level retry allow operators to manage the pipeline without direct database access. The pipeline monitoring UI is only meaningful after the async pipeline (F01) is operational.

---

### Terminology

- **Pipeline run:** A single execution lifecycle of the classification pipeline from trigger to completion or failure.
- **Stage:** One of three pipeline phases: `EXTRACT`, `CLASSIFY`, `PERSIST`. Each stage has independent state and retry capability.
- **Stage state:** `IDLE`, `RUNNING`, `PAUSED`, `STOPPED`, `FAILED`, `COMPLETED`.
- **Pipeline state:** Aggregate of stage states; one of `RUNNING`, `PAUSED`, `STOPPED`, `FAILED`.
- **Queue depth:** Number of `CLASSIFICATION` records in `PENDING` status awaiting pipeline pickup.
- **Stuck record:** Classification in `PROCESSING` status beyond `STUCK_TIMEOUT_MINUTES` env var.
- **CallerRunsPolicy:** `ThreadPoolTaskExecutor` rejection handler; prevents silent task drops under load by running rejected tasks on the calling thread.

---

### Sub-features

- FR-5.1 — View pipeline status, stage cards, and DB/queue health panel
- FR-5.2 — Control actions: Start, Stop, Pause, Resume
- FR-5.3 — Stage-level retry for individual failed stages
- FR-5.4 — Pipeline event log viewer, run history, DB connection health
- FR-5.5 — Manual sync trigger

---

### Process

#### FR-5.1 — Status and Health View
1. Client `GET /api/pipeline/status` — returns current pipeline state, active run count, queue depth.
2. Client `GET /api/pipeline/health` — returns DB connection pool stats (active, idle, max), queue depth.
3. Client `GET /api/pipeline/{id}/stages` — returns list of stage cards with: stage name, state, last run timestamp, duration (ms), error message (if failed).
4. Stuck records: query returns `classifications` where `status=PROCESSING` and `updated_at < now - STUCK_TIMEOUT_MINUTES`.
5. Stuck records are highlighted in the monitoring UI with a warning indicator.
6. Frontend polls `GET /api/pipeline/status` every 10 s while any pipeline run is active.

#### FR-5.2 — Control Actions
- `POST /api/pipeline/{id}/start` — starts a pipeline run; returns `202 Accepted` if queued, `409 ALREADY_RUNNING` if a run is active.
- `POST /api/pipeline/{id}/stop` — gracefully stops current run; in-flight stage completes, subsequent stages skipped.
- `POST /api/pipeline/{id}/pause` — pauses processing after current stage completes; state persisted.
- `POST /api/pipeline/{id}/resume` — resumes a paused pipeline from where it stopped.
- All control actions require `ADMIN` role.
- All return `200 OK` (or `202` for start) with updated pipeline state.

#### FR-5.3 — Stage-Level Retry
1. Admin `POST /api/pipeline/{id}/stages/{stageId}/retry`.
2. Validates stage is in `FAILED` state; `400 INVALID_STAGE_STATE` otherwise.
3. Resets stage to `IDLE`, re-queues for execution.
4. Returns `202 Accepted` with stage status.

#### FR-5.4 — Logs and Run History
- `GET /api/pipeline/{id}/logs` — returns pipeline event log entries (time, level, message); paginated; monospaced panel in UI.
- `GET /api/pipeline/{id}/history` — returns list of past pipeline runs with: runId, startedAt, completedAt, status, recordsProcessed, failedCount.
- `GET /api/pipeline/stats` — aggregate statistics: total runs, total processed, total failed, avg duration.
- Log entries must never contain extracted PDF text or PHI.

#### FR-5.5 — Manual Sync
- `POST /api/pipeline/sync` — triggers a one-off sync job to pick up any `PENDING` classifications not yet in active pipeline run.
- Returns `202 Accepted` with `{queued: N}` count.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` (pipeline run) | UUID | yes (stage ops) | Valid pipeline run ID |
| `stageId` | string | yes (stage retry) | One of: `EXTRACT`, `CLASSIFY`, `PERSIST` |
| `page` | integer | no | Default 0 |
| `size` | integer | no | Default 50 for logs |

---

### Outputs

| Endpoint | HTTP Status | Response Shape |
|---|---|---|
| `GET /pipeline/status` | `200 OK` | `{state, activeRuns, queueDepth, stuckRecordCount}` |
| `GET /pipeline/health` | `200 OK` | `{dbConnections: {active, idle, max}, queueDepth}` |
| `GET /pipeline/{id}/stages` | `200 OK` | `[{stage, state, lastRunAt, durationMs, errorMessage}]` |
| `GET /pipeline/{id}/logs` | `200 OK` | Paginated `[{timestamp, level, message}]` |
| `GET /pipeline/{id}/history` | `200 OK` | `[{runId, startedAt, completedAt, status, processed, failed}]` |
| `GET /pipeline/stats` | `200 OK` | `{totalRuns, totalProcessed, totalFailed, avgDurationMs}` |
| `POST /pipeline/{id}/start` | `202 Accepted` | `{state: "RUNNING", runId}` |
| `POST /pipeline/{id}/stop` | `200 OK` | `{state: "STOPPED"}` |
| `POST /pipeline/sync` | `202 Accepted` | `{queued: N}` |

---

### Validation Rules

- Control actions (`start`, `stop`, `pause`, `resume`, `sync`) require `ADMIN` role; `403` otherwise.
- `start`: returns `409 ALREADY_RUNNING` if a run is already in `RUNNING` state.
- `resume`: only valid if state is `PAUSED`; `400 INVALID_STATE` otherwise.
- Stage retry: stage must be in `FAILED` state; `400 INVALID_STAGE_STATE` otherwise.
- Log entries: must not contain raw extracted text; maximum log message length 1000 chars; truncate at 500 chars if oversized.
- `STUCK_TIMEOUT_MINUTES`: configurable env var (default 15); used for stuck-record surfacing in UI.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Pipeline not found | `404 Not Found` | `NOT_FOUND` | "Pipeline run {id} not found" |
| Already running | `409 Conflict` | `ALREADY_RUNNING` | "A pipeline run is already active" |
| Invalid state for action | `400 Bad Request` | `INVALID_STATE` | "Action not valid for current pipeline state: {state}" |
| Invalid stage for retry | `400 Bad Request` | `INVALID_STAGE_STATE` | "Stage {stageId} is not in FAILED state" |
| Insufficient permissions | `403 Forbidden` | `ACCESS_DENIED` | "Pipeline control requires ADMIN role" |

---

### API Surface (this feature)
See `Y1-api.md` §Pipeline for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/pipeline/status` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/health` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/stats` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/{id}` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/{id}/stages` | JWT | `MANAGER` |
| `GET` | `/api/pipeline/{id}/logs` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/{id}/history` | JWT | `MANAGER` |
| `POST` | `/api/pipeline/{id}/start` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/stop` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/pause` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/resume` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/{id}/stages/{stageId}/retry` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/sync` | JWT | `ADMIN` |
| `GET` | `/api/pipeline/connections` | JWT | `ADMIN` |
| `POST` | `/api/pipeline/connections/{id}/check` | JWT | `ADMIN` |

---

### Schema Surface (this feature)
Pipeline monitoring reads from `classifications` table (for stuck records, queue depth). Pipeline run state is managed in-memory by `ThreadPoolTaskExecutor` and persisted to an optional `pipeline_runs` event log table (if implemented for history persistence). See `Y0-schema.md` §Pipeline.

Key runtime state:
- `classifications.status = 'PROCESSING'` + `updated_at` — used for stuck record detection
- `classifications.status = 'PENDING'` — queue depth count
- Pipeline runs/logs optionally persisted for audit history
