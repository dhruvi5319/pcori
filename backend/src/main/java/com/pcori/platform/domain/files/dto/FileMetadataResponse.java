package com.pcori.platform.domain.files.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response for GET /api/files/{id} — file metadata only (ADMIN).
 * Never includes the S3 pre-signed URL — use the /download-url endpoint for that.
 */
public record FileMetadataResponse(
        UUID id,
        String originalName,
        String contentType,
        long size,
        String path,
        UUID uploadedBy,
        Instant uploadedAt
) {}
