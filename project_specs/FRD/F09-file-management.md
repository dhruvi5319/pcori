---

## F09: File Management (S3 Storage)
*Maps to FR-10 | Priority: P0 | Phase: 1→2 | Depends on: F00*

**Description:** All uploaded PDF research plans are tracked in an `UploadedFile` entity and persisted to S3-compatible object storage. The `StorageService` interface abstracts the storage provider so AWS S3, Azure Blob, or MinIO can be swapped via configuration. Pre-signed URLs with a 15-minute TTL are used for all downloads — permanent public URLs are never issued. This feature is a prerequisite to F01 (classification upload).

---

### Terminology

- **StorageService:** Interface with methods `store(file) → path`, `getDownloadUrl(path) → preSignedUrl`, `delete(path)`; implementations: `S3StorageService` (AWS SDK v2), `MinioStorageService` (for local dev with LocalStack).
- **Pre-signed URL:** Temporary S3 URL with 15-minute TTL (configurable); generated via AWS SDK v2 `S3Presigner`; expires after TTL and cannot be refreshed without a new API call.
- **endpointOverride:** AWS SDK v2 config property; set to LocalStack endpoint in dev (`http://localhost:4566`) or MinIO endpoint; not set in production.
- **UploadedFile:** Entity tracking file metadata; linked to a `Classification` record after upload.
- **Apache Tika:** MIME detection library used to validate actual file content type (not just extension).
- **PHI safeguard:** Extracted text never stored in full; never logged; S3 bucket has public access blocked.

---

### Sub-features

- FR-10.1 — `UploadedFile` entity tracking: filename, originalName, contentType, size, storagePath, uploadedBy, uploadedAt
- FR-10.2 — File persistence to S3-compatible object storage via `StorageService` interface
- Pre-signed download URL generation (15-min TTL)
- MIME validation via Apache Tika before storage
- S3 bucket public-access denial
- PHI safeguards on storage and logging

---

### Process

#### FR-10.1 / FR-10.2 — File Upload and Storage
1. `ClassificationService` receives multipart file from `POST /api/classifications/upload`.
2. Apache Tika inspects file bytes (not just extension) to detect MIME type.
3. If MIME ≠ `application/pdf`: return `400 INVALID_FILE_TYPE` before touching storage.
4. File size check: if > `MAX_UPLOAD_SIZE_MB` (env var, default 50): return `413 FILE_TOO_LARGE`.
5. Generate storage key: `pdfs/{year}/{month}/{uuid}-{sanitizedFilename}.pdf`.
6. Call `StorageService.store(fileBytes, key, contentType)`.
7. Create `UploadedFile` record: `{filename: key, originalName, contentType: "application/pdf", size, path: key, uploadedBy: currentUser, uploadedAt: now}`.
8. Link `UploadedFile.id` to newly created `Classification.uploadedFileId`.

#### Pre-signed URL Generation
1. Client or service calls `GET /api/files/{id}/download-url`.
2. System retrieves `UploadedFile` by `id`; validates `uploadedBy = currentUser` or `ADMIN` role.
3. Calls `StorageService.getDownloadUrl(file.path)` → pre-signed URL with 15-min TTL.
4. Returns `{url: "<pre-signed-url>", expiresAt: "<ISO-8601>"}`.
5. Never returns a permanent S3 object URL; never sets object ACL to public-read.

#### S3 Bucket Security
- Bucket policy: `s3:GetObject` denied for all principals except the application IAM role and pre-signed URL recipients.
- `BlockPublicAcls: true`, `IgnorePublicAcls: true`, `BlockPublicPolicy: true`, `RestrictPublicBuckets: true`.
- All objects stored with server-side encryption (SSE-S3 or SSE-KMS — TBD with DevOps/compliance).

#### Dev/Local Storage Config
- LocalStack endpoint: `http://localhost:4566` via `AWS_ENDPOINT_OVERRIDE` env var.
- MinIO: same pattern via `endpointOverride`.
- `StorageService` bean selected via `@ConditionalOnProperty("storage.provider")`: values `s3` or `local`.

#### PHI Safeguards
- Extracted PDF text: never written to application logs at INFO or higher. Acceptable: TRACE level only.
- `Classification.textPreview` stores ≤500 chars only.
- S3 object keys do not include patient names or plan titles — only UUID-based keys.
- Raw text not stored in database columns (only `textPreview` truncated field).
- Compliance review required before processing real PHI-containing research plan PDFs through ML provider.

---

### Inputs

| Field | Type | Required | Constraints |
|---|---|---|---|
| `file` | multipart binary | yes | PDF only; max `MAX_UPLOAD_SIZE_MB` |
| `id` (file entity) | UUID | yes (download) | Valid `UploadedFile.id` |
| `ttl` | integer (seconds) | no | Pre-signed URL TTL; default 900 (15 min); max 3600 |

---

### Outputs

| Scenario | HTTP Status | Response |
|---|---|---|
| File stored (internal) | — | `UploadedFile` record created; S3 object stored |
| Download URL | `200 OK` | `{url: "<pre-signed-url>", expiresAt: "<ISO-8601>"}` |
| File metadata | `200 OK` | `{id, originalName, contentType, size, uploadedAt, uploadedBy}` |
| File list (admin) | `200 OK` | Paginated `UploadedFile` list |
| File deleted | `200 OK` | `{message: "File deleted"}` |

---

### Validation Rules

- MIME type check via Apache Tika (byte-level, not extension). Must equal `application/pdf`. `400 INVALID_FILE_TYPE`.
- File size ≤ `MAX_UPLOAD_SIZE_MB` env var (default 50 MB). `413 FILE_TOO_LARGE`.
- Pre-signed URL TTL: 15 minutes default (`PRE_SIGNED_URL_TTL_SECONDS` env var, default 900); max 3600.
- Download authorization: requesting user must be the file uploader or have `ADMIN` role.
- S3 object keys: UUID-based (`{uuid}-{sanitized-name}.pdf`); no path traversal characters; sanitize original filename before constructing key.
- File deletion: only via admin action; soft-delete sets `deleted_at` on `UploadedFile`; S3 object optionally deleted or retained per data retention policy.
- Pre-signed URLs must never be logged or stored in database; ephemeral by design.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Non-PDF MIME type | `400 Bad Request` | `INVALID_FILE_TYPE` | "Only PDF files are accepted" |
| File too large | `413 Payload Too Large` | `FILE_TOO_LARGE` | "File exceeds maximum size of {n}MB" |
| File not found | `404 Not Found` | `NOT_FOUND` | "File {id} not found" |
| Access denied to file | `403 Forbidden` | `ACCESS_DENIED` | "Access denied" |
| S3 storage failure | `503 Service Unavailable` | `STORAGE_UNAVAILABLE` | "Storage service is unavailable" |
| S3 download URL failure | `503 Service Unavailable` | `STORAGE_UNAVAILABLE` | "Unable to generate download URL" |

---

### API Surface (this feature)
See `Y1-api.md` §Files for full request/response schemas.

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/files` | JWT | `ADMIN` |
| `GET` | `/api/files/{id}` | JWT | owner or `ADMIN` |
| `GET` | `/api/files/{id}/download-url` | JWT | owner or `ADMIN` |
| `DELETE` | `/api/files/{id}` | JWT | `ADMIN` |

*Note: File upload is handled via `POST /api/classifications/upload` (F01), not a standalone files endpoint.*

---

### Schema Surface (this feature)
Uses table: `uploaded_files` — see `Y0-schema.md` §Files.

Key fields:
- `uploaded_files.filename` — S3 object key (UUID-based path)
- `uploaded_files.original_name` — original filename from client upload
- `uploaded_files.content_type` — always `application/pdf` after Tika validation
- `uploaded_files.size` — file size in bytes
- `uploaded_files.path` — S3 object key (same as `filename` in current design)
- `uploaded_files.uploaded_by` — FK to `users.id`

### Integration Dependencies
See `Y3-integrations.md` §Storage for full `StorageService` interface contract and provider configuration.
