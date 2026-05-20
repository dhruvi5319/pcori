---

## 5. Security Architecture

### 5.1 Authentication Model

The platform uses **stateless JWT authentication** via `Authorization: Bearer <token>` on all protected requests. There are no server-side sessions. The JWT is validated on every request by `JwtAuthFilter` (a `OncePerRequestFilter`).

```
JWT Lifecycle:
  Register → [email verification] → Login → JWT (1h) + RefreshToken (long-lived)
                                         ↓
                              Protected API calls (Bearer header)
                                         ↓
                              JWT expires → POST /api/auth/refresh
                                         ↓
                              Logout → RefreshToken revoked (server-side mark)
```

**JWT token structure:**
- Algorithm: HS512
- Subject: user UUID
- Claims: `roles` (array of role names), `exp`, `iat`, `username`
- Secret: `JWT_SECRET` env var (minimum 64 chars / 512 bits); application throws `IllegalStateException` at startup if missing or too short
- Default expiry: 1 hour (configurable via `JWT_EXPIRATION_MS`)

**Startup validation:**
```java
@Value("${JWT_SECRET}")
private String jwtSecret;

@PostConstruct
public void validateSecret() {
    if (jwtSecret == null || jwtSecret.length() < 64) {
        throw new IllegalStateException(
            "JWT_SECRET environment variable is required and must be at least 64 characters (512-bit)");
    }
}
```

### 5.2 Authorization Model (RBAC)

Five roles with hierarchical permissions:

| Role | Key Capabilities |
|---|---|
| `REVIEWER` | Upload plans, view classifications, submit overrides, view dashboard |
| `MANAGER` | All REVIEWER + analytics, reports, pipeline status, statistics |
| `TAXONOMY_ADMIN` | All REVIEWER + taxonomy CRUD, activate/deactivate codes |
| `ADMIN` | All permissions + user CRUD, pipeline control, file admin, help admin |
| `VIEWER` | Read-only: dashboard, analytics, reports download |

**Implementation: Service-layer enforcement**

```java
// RBAC enforced at service layer via @PreAuthorize (not controller-only)
@Service
@RequiredArgsConstructor
public class ClassificationService {

    @PreAuthorize("hasRole('REVIEWER')")
    @Transactional
    public Classification uploadAndClassify(MultipartFile file,
                                            UploadMetadataRequest metadata,
                                            String username) { ... }

    @PreAuthorize("hasAnyRole('REVIEWER', 'ADMIN')")
    public Classification getById(UUID id) { ... }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteClassification(UUID id) { ... }

    @PreAuthorize("hasRole('MANAGER')")
    public ClassificationStatistics getStatistics() { ... }
}
```

**Permission granularity (stored in `permissions` table):**

| Permission | Resource | Action |
|---|---|---|
| `classifications:read` | classifications | READ |
| `classifications:write` | classifications | CREATE |
| `classifications:override` | classifications | UPDATE |
| `classifications:delete` | classifications | DELETE |
| `taxonomy:read` | taxonomy | READ |
| `taxonomy:manage` | taxonomy | WRITE |
| `users:manage` | users | ALL |
| `pipeline:view` | pipeline | READ |
| `pipeline:control` | pipeline | EXECUTE |
| `reports:generate` | reports | CREATE |
| `analytics:view` | analytics | READ |

### 5.3 Password Security

- BCrypt strength 12 (cost factor)
- Password complexity: 8–128 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit
- Passwords never logged, never returned in API responses
- BCrypt bean:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
}
```

### 5.4 Account Lockout

```
Failed login:
  increment users.login_attempts
  IF login_attempts >= MAX_LOGIN_ATTEMPTS (default 5):
    SET locked_until = NOW() + LOCKOUT_DURATION_MINUTES (default 30)
    RETURN 403 ACCOUNT_LOCKED

Lockout check on each login:
  IF locked_until IS NOT NULL AND locked_until > NOW():
    RETURN 403 ACCOUNT_LOCKED with time remaining

Admin unlock:
  PATCH /api/users/{id}/status { isActive: true }
  → resets login_attempts = 0, clears locked_until

Auto-expiry:
  Checked on each login attempt: if locked_until < NOW(), treat as unlocked
```

### 5.5 CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // Production: replace with actual origin from env var
    config.setAllowedOrigins(List.of(
        System.getenv().getOrDefault("ALLOWED_ORIGIN", "http://localhost:3000")
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    // Required for Excel download: Content-Disposition must be exposed
    config.setExposedHeaders(List.of("Content-Disposition", "Content-Type"));
    config.setAllowCredentials(false);   // localStorage JWT — no credentials cookie
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

**Critical:** Never use wildcard origin (`*`) in production. `ALLOWED_ORIGIN` must be set to the exact frontend URL.

### 5.6 Data Protection

| Control | Implementation |
|---|---|
| Password hashing | BCrypt strength 12 |
| JWT secret | Env var only (`JWT_SECRET`); min 512-bit; startup failure if missing |
| PHI in logs | Extracted PDF text never logged above TRACE; structured logging via Logback |
| PHI in DB | `textPreview` max 500 chars only; raw extracted text never stored |
| S3 security | `BlockPublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets` all true; SSE-S3 encryption |
| S3 access | Pre-signed URLs (15-min TTL) only; no permanent public URLs |
| S3 keys | UUID-based (`pdfs/{year}/{month}/{uuid}-{name}.pdf`); no patient names in path |
| HTTPS | Required in production; HSTS header; no HTTP fallback |
| Swagger | Disabled in production profile (`springdoc.swagger-ui.enabled=false`) |
| Actuator | Only `/actuator/health` and `/actuator/prometheus` exposed externally; others restricted |

### 5.7 PHI Safeguards

```java
// CORRECT: Text preview only; no full text
c.setTextPreview(extractedText.length() > 500
    ? extractedText.substring(0, 500)
    : extractedText);

// CORRECT: TRACE level only for diagnostic text
log.trace("Extracted {} chars from PDF {}", extractedText.length(), classificationId);

// WRONG — never do this:
log.info("Extracted text: {}", extractedText);   // PHI violation
log.debug("PDF content: {}", extractedText);      // PHI violation
c.setFullText(extractedText);                     // never stored in DB
```

S3 object key pattern (no PHI in path):
```java
// CORRECT: UUID-based key
String key = String.format("pdfs/%d/%02d/%s-%s.pdf",
    year, month, UUID.randomUUID(), sanitizedFilename);

// sanitizedFilename: replaces spaces/special chars; no patient names allowed in key
String sanitizedFilename = originalName.replaceAll("[^a-zA-Z0-9._-]", "_").toLowerCase();
```

### 5.8 Environment Variables (Required)

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Mandatory** | Min 64 chars; HS512 signing key; startup failure if missing |
| `JWT_EXPIRATION_MS` | Optional | Default 3600000 (1 hour) |
| `DATABASE_URL` | Mandatory | JDBC URL for PostgreSQL |
| `DATABASE_USERNAME` | Mandatory | DB user |
| `DATABASE_PASSWORD` | Mandatory | DB password |
| `AWS_ACCESS_KEY_ID` | Mandatory (prod) | S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | Mandatory (prod) | S3 credentials |
| `AWS_S3_BUCKET` | Mandatory | S3 bucket name |
| `AWS_ENDPOINT_OVERRIDE` | Dev only | LocalStack/MinIO endpoint |
| `MAIL_HOST` | Mandatory | SMTP host |
| `MAIL_PORT` | Mandatory | SMTP port (587 for STARTTLS) |
| `MAIL_USERNAME` | Mandatory | SMTP credentials |
| `MAIL_PASSWORD` | Mandatory | SMTP credentials |
| `ALLOWED_ORIGIN` | Mandatory (prod) | Frontend URL for CORS |
| `MAX_LOGIN_ATTEMPTS` | Optional | Default 5 |
| `LOCKOUT_DURATION_MINUTES` | Optional | Default 30 |
| `PASSWORD_RESET_TTL_MINUTES` | Optional | Default 60 |
| `MAX_UPLOAD_SIZE_MB` | Optional | Default 50 |
| `STUCK_TIMEOUT_MINUTES` | Optional | Default 15 |
| `PRE_SIGNED_URL_TTL_SECONDS` | Optional | Default 900 (15 min) |
| `NEEDS_REVIEW_THRESHOLD` | Optional | Default 0.75 (admin-configurable at runtime too) |
| `APP_CLASSIFICATION_STRATEGY` | Optional | `keyword` (default) or `openai` / `anthropic` / `bedrock` |

---

*Section 5 of 7 — TechArch-PCORI.md*
