package com.pcori.platform.integration.storage;

import com.pcori.platform.common.exception.DomainExceptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.InputStream;
import java.net.URI;
import java.time.Duration;

@Service
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${STORAGE_BUCKET:pcori-files}")
    private String bucket;

    public S3StorageService(S3Client s3Client,
                            @Value("${STORAGE_ENDPOINT:}") String storageEndpoint,
                            @Value("${AWS_REGION:us-east-1}") String region,
                            @Value("${AWS_ACCESS_KEY_ID:minioadmin}") String accessKeyId,
                            @Value("${AWS_SECRET_ACCESS_KEY:minioadmin}") String secretAccessKey) {
        this.s3Client = s3Client;

        // Build presigner with same endpoint override
        S3Presigner.Builder presignerBuilder = S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)));
        if (storageEndpoint != null && !storageEndpoint.isBlank()) {
            presignerBuilder.endpointOverride(URI.create(storageEndpoint));
        }
        this.s3Presigner = presignerBuilder.build();
    }

    @Override
    public String store(InputStream inputStream, String storageKey, String contentType, long sizeBytes) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .contentType(contentType)
                .contentLength(sizeBytes)
                .build();
            s3Client.putObject(request, RequestBody.fromInputStream(inputStream, sizeBytes));
            log.info("Stored file at key: {}", storageKey);
            return storageKey;
        } catch (S3Exception e) {
            log.error("S3 upload failed for key {}: {}", storageKey, e.getMessage());
            throw new DomainExceptions.StorageUnavailableException("File storage is unavailable. Try again.");
        }
    }

    @Override
    public String getDownloadUrl(String storageKey, int ttlSeconds) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(ttlSeconds))
            .getObjectRequest(r -> r.bucket(bucket).key(storageKey))
            .build();
        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        // Never log this URL — it contains auth credentials
        return presigned.url().toString();
    }

    @Override
    public InputStream getFile(String storageKey) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .build();
            return s3Client.getObject(request);
        } catch (S3Exception e) {
            log.error("S3 download failed for key {}", storageKey);
            throw new DomainExceptions.StorageUnavailableException("File storage is unavailable. Try again.");
        }
    }

    @Override
    public void delete(String storageKey) {
        // Soft-delete: log intent only; actual deletion deferred to admin cleanup job
        log.info("File marked for deletion: {}", storageKey);
    }
}
