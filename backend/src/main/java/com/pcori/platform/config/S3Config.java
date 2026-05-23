package com.pcori.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

/**
 * S3Client bean configuration.
 * When STORAGE_ENDPOINT is set (MinIO / LocalStack dev), applies endpointOverride
 * and forcePathStyle. Otherwise uses default AWS SDK endpoint resolution (production).
 */
@Configuration
public class S3Config {

    @Value("${STORAGE_ENDPOINT:}")
    private String storageEndpoint;

    @Value("${AWS_REGION:us-east-1}")
    private String region;

    @Value("${AWS_ACCESS_KEY_ID:}")
    private String accessKeyId;

    @Value("${AWS_SECRET_ACCESS_KEY:}")
    private String secretAccessKey;

    @Bean
    public S3Client s3Client() {
        S3ClientBuilder builder = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)));

        if (storageEndpoint != null && !storageEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(storageEndpoint))
                   .forcePathStyle(true);  // required for MinIO path-style addressing
        }
        return builder.build();
    }
}
