package com.pcori.platform.domain.files.dto;

import java.time.Instant;

/**
 * Response for GET /api/files/{id}/download-url.
 * Contains a pre-signed URL and its expiration time.
 * Never log or store the url field — it contains embedded auth credentials.
 */
public record DownloadUrlResponse(String url, Instant expiresAt) {}
