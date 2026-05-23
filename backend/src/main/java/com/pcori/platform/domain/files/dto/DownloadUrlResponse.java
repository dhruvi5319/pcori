package com.pcori.platform.domain.files.dto;

import java.time.Instant;

public record DownloadUrlResponse(
    String url,
    Instant expiresAt
) {}
