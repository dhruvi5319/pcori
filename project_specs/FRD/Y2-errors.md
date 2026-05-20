---

## Y2: Cross-Feature Error Catalog

All error responses follow RFC 7807 Problem Details format:
```json
{
  "type": "https://pcori.example.com/errors/{error-code}",
  "title": "Human-readable title",
  "status": 400,
  "detail": "Specific error message",
  "timestamp": "2026-05-20T10:00:00Z",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
The `errors` array is present for validation errors only (400 with field-level details).

---

### Authentication & Authorization Errors (F00)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Validation Failed | See `errors[]` for field-level messages | Fix input |
| `400` | `INVALID_TOKEN` | Invalid Token | Reset/verify token is invalid or expired | No — request new token |
| `400` | `QUERY_TOO_SHORT` | Query Too Short | Search query must be at least 2 characters | Fix input |
| `401` | `TOKEN_MISSING` | Authorization Required | Authorization header is required | Add token |
| `401` | `TOKEN_INVALID` | Invalid Token | Access token signature is invalid | Re-authenticate |
| `401` | `TOKEN_EXPIRED` | Token Expired | Access token has expired | Use refresh token |
| `401` | `INVALID_CREDENTIALS` | Invalid Credentials | Invalid username or password | Check credentials |
| `403` | `ACCOUNT_LOCKED` | Account Locked | Account is temporarily locked | Wait or contact admin |
| `403` | `ACCOUNT_INACTIVE` | Account Inactive | Account has been deactivated | Contact admin |
| `403` | `EMAIL_NOT_VERIFIED` | Email Not Verified | Verify email before logging in | Check email |
| `403` | `ACCESS_DENIED` | Access Denied | Insufficient role or permission | Contact admin |
| `403` | `SELF_DEACTIVATION` | Self-Deactivation Blocked | Cannot deactivate your own account | N/A |
| `409` | `USERNAME_TAKEN` | Username Unavailable | Username is already in use | Choose another |
| `409` | `EMAIL_TAKEN` | Email Registered | Email is already registered | Use existing account |

---

### Classification Errors (F01)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_FILE_TYPE` | Invalid File Type | Only PDF files are accepted | Upload PDF |
| `400` | `INVALID_TAXONOMY_CODE` | Invalid Taxonomy Code | Taxonomy code is not active | Use active code |
| `400` | `INVALID_STATUS` | Invalid Status | Operation not allowed for current status | Check status |
| `413` | `FILE_TOO_LARGE` | File Too Large | File exceeds maximum allowed size | Reduce file size |
| `404` | `NOT_FOUND` | Not Found | Classification {id} not found | Check ID |
| `503` | `STORAGE_UNAVAILABLE` | Storage Unavailable | File storage service is unavailable | Retry |
| — (internal) | — | Pipeline FAILED | Error stored on `Classification.errorMessage`; status set to `FAILED` | Yes — use retry endpoint |

**Classification Status Transitions (informational):**
```
PENDING → PROCESSING → CLASSIFIED  (success, confidence ≥ threshold)
PENDING → PROCESSING → NEEDS_REVIEW (confidence < threshold OR extraction warning)
PENDING → PROCESSING → FAILED       (unrecoverable pipeline error)
FAILED → PENDING                    (via retry endpoint)
*anything* → CLASSIFIED             (via override endpoint)
```

---

### Taxonomy Errors (F02)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_LEVEL` | Invalid Level | Level must be parent level + 1 | Fix input |
| `400` | `INVALID_PARENT` | Invalid Parent | Parent category not found or inactive | Use active parent |
| `400` | `CIRCULAR_REFERENCE` | Circular Reference | Cannot set parent: would create a cycle | Fix hierarchy |
| `400` | `INACTIVE_PARENT` | Inactive Parent | Cannot activate: parent is inactive | Activate parent first |
| `404` | `NOT_FOUND` | Not Found | Taxonomy category {id} not found | Check ID |
| `409` | `CODE_DUPLICATE` | Duplicate Code | Code already exists under this parent | Choose unique code |

---

### Dashboard / Analytics Errors (F03)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_DATE_RANGE` | Invalid Date Range | startDate must be ≤ endDate | Fix dates |
| `400` | `VALIDATION_ERROR` | Validation Failed | Invalid widget layout format | Fix payload |
| `404` | `NOT_FOUND` | Not Found | Dashboard configuration not found | Check ID |

---

### Pipeline Errors (F04)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_STATE` | Invalid State | Action not valid for current pipeline state | Check state first |
| `400` | `INVALID_STAGE_STATE` | Invalid Stage State | Stage is not in FAILED state | Check stage state |
| `404` | `NOT_FOUND` | Not Found | Pipeline run {id} not found | Check ID |
| `409` | `ALREADY_RUNNING` | Already Running | A pipeline run is already active | Wait or stop first |

---

### Reports Errors (F05)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_COLUMN` | Invalid Column | Column '{name}' is not a valid report column | Use valid column |
| `400` | `INVALID_DATE_RANGE` | Invalid Date Range | startDate must be ≤ endDate | Fix dates |
| `404` | `NOT_FOUND` | Not Found | Report/template {id} not found | Check ID |
| `409` | `REPORT_NOT_READY` | Report Not Ready | Report is still generating | Poll until READY |
| `409` | `DUPLICATE_NAME` | Duplicate Name | Template name already exists for this user | Choose another name |
| `500` | `GENERATION_FAILED` | Generation Failed | Report generation failed | Retry |

---

### User Management Errors (F06)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_ROLE` | Invalid Role | Role {id} not found | Use valid role ID |
| `400` | `SELF_DEACTIVATION` | Self-Deactivation | Cannot deactivate your own account | N/A |
| `404` | `NOT_FOUND` | Not Found | User {id} not found | Check ID |
| `409` | `USERNAME_TAKEN` | Username Taken | Username already in use | Choose another |
| `409` | `EMAIL_TAKEN` | Email Taken | Email already registered | Use different email |

---

### Notifications Errors (F07)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Validation Failed | Invalid event type or channel | Fix input |
| `403` | `ACCESS_DENIED` | Access Denied | Cannot access another user's notification | N/A |
| `404` | `NOT_FOUND` | Not Found | Notification {id} not found | Check ID |

---

### Help Center Errors (F08)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `QUERY_TOO_SHORT` | Query Too Short | Search query must be ≥ 2 characters | Fix input |
| `404` | `NOT_FOUND` | Not Found | Article '{slug}' not found | Check slug |
| `409` | `DUPLICATE_SLUG` | Duplicate Slug | Article slug already exists | Choose unique slug |

---

### File Management Errors (F09)

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `400` | `INVALID_FILE_TYPE` | Invalid File Type | Only PDF files are accepted | Upload PDF |
| `403` | `ACCESS_DENIED` | Access Denied | You do not own this file | N/A |
| `404` | `NOT_FOUND` | Not Found | File {id} not found | Check ID |
| `413` | `FILE_TOO_LARGE` | File Too Large | File exceeds {n}MB limit | Reduce file size |
| `503` | `STORAGE_UNAVAILABLE` | Storage Unavailable | Storage service unavailable | Retry |

---

### Generic / Infrastructure Errors

| HTTP Status | Error Code | Title | Detail | Retry? |
|---|---|---|---|---|
| `404` | `NOT_FOUND` | Not Found | The requested resource was not found | Check path/ID |
| `405` | `METHOD_NOT_ALLOWED` | Method Not Allowed | HTTP method not supported for this endpoint | Fix method |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Unsupported Media Type | Request content-type not supported | Fix Content-Type |
| `429` | `RATE_LIMITED` | Rate Limited | Too many requests | Back off and retry |
| `500` | `INTERNAL_ERROR` | Internal Server Error | An unexpected error occurred | Retry; contact support |
| `503` | `SERVICE_UNAVAILABLE` | Service Unavailable | Downstream dependency unavailable | Retry with backoff |

---

### Frontend Error Handling Patterns

| Scenario | UI Behavior |
|---|---|
| `401 TOKEN_EXPIRED` | Auto-redirect to `/login` with sonner toast "Session expired" |
| `401 TOKEN_MISSING` or `TOKEN_INVALID` | Redirect to `/login` |
| `403 ACCESS_DENIED` | Show inline error; do not redirect |
| `400 VALIDATION_ERROR` | Inline field-level errors on form; do not toast |
| `404 NOT_FOUND` | Show empty state with CTA |
| `409` conflicts | Toast with specific message |
| `500 / 503` | sonner toast (red) with optional retry action |
| Network error / timeout | sonner toast "Connection error" with retry action |
