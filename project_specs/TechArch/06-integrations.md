---

## 7. Integration Points

### 7.1 StorageService — S3-Compatible Object Storage

**Interface contract:**

```java
// integration/storage/StorageService.java
public interface StorageService {

    /**
     * Store a file and return its object key (storage path).
     * @param key      S3 object key (UUID-based; no PHI in path)
     * @param content  File input stream
     * @param contentType  MIME type (always "application/pdf" after Tika validation)
     * @return         S3 object key (stored as Classification.filePath)
     */
    String store(String key, InputStream content, String contentType);

    /**
     * Generate a pre-signed URL for a stored object.
     * @param key      S3 object key
     * @param ttlSeconds  URL expiry (default 900 = 15 min)
     * @return         Pre-signed URL string; never logged or stored
     */
    String getDownloadUrl(String key, int ttlSeconds);

    /**
     * Download object content.
     * @param key  S3 object key
     * @return     InputStream for the object
     */
    InputStream download(String key);

    /**
     * Soft-delete the object record; optionally delete the S3 object.
     * @param key  S3 object key
     */
    void delete(String key);
}
```

**S3 implementation:**

```java
// integration/storage/S3StorageService.java
@Service
@ConditionalOnProperty(name = "storage.provider", havingValue = "s3", matchIfMissing = true)
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Override
    public String store(String key, InputStream content, String contentType) {
        try {
            byte[] bytes = content.readAllBytes();
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket).key(key).contentType(contentType)
                    .serverSideEncryption(ServerSideEncryption.AES256)  // SSE-S3
                    .build(),
                RequestBody.fromBytes(bytes)
            );
            return key;
        } catch (S3Exception | IOException e) {
            throw new StorageException("Failed to store file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getDownloadUrl(String key, int ttlSeconds) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(ttlSeconds))
            .getObjectRequest(r -> r.bucket(bucket).key(key))
            .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
```

**S3 configuration (dev — LocalStack / MinIO):**

```java
// config/S3Config.java
@Configuration
public class S3Config {

    @Value("${app.s3.endpoint:#{null}}")
    private String endpointOverride;

    @Value("${app.s3.region:us-east-1}")
    private String region;

    @Bean
    public S3Client s3Client(AwsCredentialsProvider credentialsProvider) {
        S3ClientBuilder builder = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(credentialsProvider);

        if (endpointOverride != null) {
            builder.endpointOverride(URI.create(endpointOverride))
                   .forcePathStyle(true);  // Required for LocalStack/MinIO
        }
        return builder.build();
    }
}
```

**application-dev.properties:**
```properties
storage.provider=s3
app.s3.endpoint=http://localhost:4566
app.s3.bucket=pcori-dev
app.s3.region=us-east-1
```

### 7.2 ClassificationStrategy — ML / Keyword

**Interface contract:**

```java
// integration/ml/ClassificationStrategy.java
public interface ClassificationStrategy {

    /**
     * Classify extracted text against the PCORI taxonomy.
     * @param extractedText  Text from PDF (truncated to context window if needed)
     * @param taxonomy       Active taxonomy categories for structured output constraint
     * @return               ClassificationResult POJO
     */
    ClassificationResult classify(String extractedText,
                                  List<TaxonomyCategory> taxonomy);
}

// ClassificationResult is the structured output POJO
public record ClassificationResult(
    String pcc,
    String taxonomyCategory,
    String taxonomyCode,
    String taxonomySubcode,
    String projectSummary,
    String populationSetting,
    String intervention,
    String comparator,
    String primaryOutcome,
    String secondaryOutcomes,
    double confidenceScore,    // 0.0–1.0
    String modelVersion
) {}
```

**Keyword fallback (default, ships first):**

```java
@Service
@ConditionalOnProperty(name = "app.classification.strategy",
    havingValue = "keyword", matchIfMissing = true)
@Slf4j
public class KeywordStrategy implements ClassificationStrategy {

    private final TaxonomyRepository taxonomyRepository;

    @Override
    public ClassificationResult classify(String extractedText,
                                         List<TaxonomyCategory> taxonomy) {
        // Simple TF/keyword matching against active taxonomy codes
        // Returns confidence 0.5–0.7 range for keyword matches
        // Falls through to NEEDS_REVIEW for low confidence
        ...
    }
}
```

**Spring AI strategy (Phase 5):**

```java
@Service
@ConditionalOnProperty(name = "app.classification.strategy", havingValue = "openai")
@RequiredArgsConstructor
public class SpringAiStrategy implements ClassificationStrategy {

    private final ChatClient chatClient;

    @Override
    public ClassificationResult classify(String extractedText,
                                         List<TaxonomyCategory> taxonomy) {
        // Truncate text to context window: model limit − prompt tokens
        String truncatedText = truncateToContextWindow(extractedText, 6000);

        String prompt = buildStructuredPrompt(truncatedText, taxonomy);

        try {
            return chatClient.prompt()
                .user(prompt)
                .call()
                .entity(ClassificationResult.class);   // structured output → POJO
        } catch (Exception e) {
            // Parse failure: fall back to keyword strategy (not FAILED status)
            log.warn("ML structured output parse failure; falling back to keyword: {}", e.getMessage());
            return keywordFallback.classify(extractedText, taxonomy);
        }
    }
}
```

**Provider swap via configuration (no code change):**

| Property | Provider |
|---|---|
| `app.classification.strategy=keyword` | `KeywordStrategy` (default; ships Phase 1) |
| `app.classification.strategy=openai` | `SpringAiStrategy` with `spring-ai-openai-spring-boot-starter` |
| `app.classification.strategy=anthropic` | `SpringAiStrategy` with `spring-ai-anthropic-spring-boot-starter` |
| `app.classification.strategy=bedrock` | `SpringAiStrategy` with `spring-ai-bedrock-converse-spring-boot-starter` |

**AWS Bedrock (HIPAA-eligible path):**
```properties
app.classification.strategy=bedrock
spring.ai.bedrock.aws.region=us-east-1
spring.ai.bedrock.converse.chat.options.model=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 7.3 EmailService — SMTP

**Interface contract:**

```java
// integration/email/EmailService.java
public interface EmailService {
    void sendEmailVerification(String toEmail, String username, String token);
    void sendPasswordReset(String toEmail, String username, String token);
    void sendNotification(String toEmail, String subject, String body);
}
```

**Implementation:**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@pcori.org}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Override
    public void sendEmailVerification(String toEmail, String username, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("Verify your PCORI Platform email");
            message.setText(String.format(
                "Hello %s,\n\nClick to verify: %s/verify-email?token=%s\n\nExpires in 24 hours.",
                username, baseUrl, token));
            mailSender.send(message);
        } catch (MailException e) {
            // Log warning; don't propagate — email failure doesn't fail registration
            log.warn("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }
}
```

**Dev (MailHog) configuration:**
```properties
spring.mail.host=localhost
spring.mail.port=1025
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false
```

**Prod (SES SMTP) configuration:**
```properties
spring.mail.host=email-smtp.us-east-1.amazonaws.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 7.4 PostgreSQL (Database)

| Environment | Config |
|---|---|
| **Development** | PostgreSQL 16 via Docker Compose (`localhost:5432`) |
| **Production** | RDS PostgreSQL 16 or managed PostgreSQL; `ddl-auto=validate` |
| **Migrations** | Flyway auto-runs on startup; versioned V-series + repeatable R-series |
| **Connection pool** | HikariCP; `spring.datasource.hikari.maximum-pool-size=10` (configurable) |
| **Dialect** | Auto-detected; no manual override needed with Spring Boot 3.4 + Hibernate 6.6 |

**application-prod.properties:**
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
```

### 7.5 Observability

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /actuator/health` | Public | DB connection, disk space, application up/down |
| `GET /actuator/prometheus` | Internal / ops | Micrometer metrics for Prometheus scraping |
| All other `/actuator/*` | Restricted (ADMIN role or internal IP) | Prevent information exposure |

**Custom classification metrics:**
```java
// In ClassificationPipeline
@Autowired
private MeterRegistry meterRegistry;

// Increment on successful classification
meterRegistry.counter("classifications.completed",
    "model", result.modelVersion(),
    "status", "CLASSIFIED").increment();

// Timer for pipeline duration
meterRegistry.timer("classifications.pipeline.duration",
    "stage", "total").record(durationMs, TimeUnit.MILLISECONDS);
```

### 7.6 Docker Compose (Development Stack)

```yaml
# docker-compose.yml
version: '3.9'
services:

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pcori_dev
      POSTGRES_USER: pcori
      POSTGRES_PASSWORD: pcori_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

  localstack:
    image: localstack/localstack:latest
    environment:
      SERVICES: s3
      AWS_DEFAULT_REGION: us-east-1
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/var/lib/localstack

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: dev
      DATABASE_URL: jdbc:postgresql://postgres:5432/pcori_dev
      DATABASE_USERNAME: pcori
      DATABASE_PASSWORD: pcori_dev_password
      JWT_SECRET: dev-secret-do-not-use-in-production-must-be-64-chars-minimum
      AWS_ENDPOINT_OVERRIDE: http://localstack:4566
      AWS_S3_BUCKET: pcori-dev
      MAIL_HOST: mailhog
      MAIL_PORT: "1025"
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - localstack
      - mailhog

volumes:
  postgres_data:
  localstack_data:
```

### 7.7 External Service Summary

| Service | Dev | Production | Interface |
|---|---|---|---|
| Object Storage | LocalStack (Docker, port 4566) | AWS S3 (or Azure Blob / MinIO) | `StorageService` interface |
| Email | MailHog (Docker, port 1025) | AWS SES / SendGrid SMTP | `EmailService` interface |
| ML Classification | Keyword fallback (in-process) | Spring AI: OpenAI / Bedrock / Anthropic | `ClassificationStrategy` interface |
| Database | PostgreSQL 16 (Docker, port 5432) | RDS PostgreSQL 16 | Spring Data JPA / HikariCP |
| Monitoring | Spring Actuator (port 8080) | Prometheus + Grafana | Micrometer registry |

### 7.8 Scaling Roadmap

| Phase | Threshold | Architecture Change |
|---|---|---|
| v1 Launch | 0–500 users | Single Spring Boot + PostgreSQL + S3. `@Async` ThreadPoolTaskExecutor. No external queue. |
| v1 Growth | 500–5K users | ALB / Nginx load balancer. Read replica for `AnalyticsService`. Redis cache for `GET /api/taxonomy/tree` (taxonomy changes rarely). Tune HikariCP pool size. |
| v2+ | 5K+ users | Extract pipeline to durable queue (SQS / RabbitMQ / Redis Streams). Multiple backend instances. WebSocket for real-time classification status. Consider read/write split at DataSource level. |

**First three scaling bottlenecks (in order):**
1. **Classification throughput** — `ThreadPoolTaskExecutor` queue fills under sustained load → introduce SQS/RabbitMQ consumer workers
2. **Analytics query latency** — `GROUP BY` on large `classifications` table → populate `dashboard_metrics` pre-aggregation table; add materialized views
3. **File upload bandwidth** — S3 handles this; v2: pre-signed S3 upload URLs from frontend (bypass backend for large files)

---

*Section 7 of 7 — TechArch-PCORI.md*
