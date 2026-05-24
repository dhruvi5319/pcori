package com.pcori.platform.domain.files.dto;

import java.time.Instant;
import java.util.UUID;

public record FileMetadataResponse(
    UUID id,
    String originalName,
    String contentType,
    long size,
    String path,
    UUID uploadedBy,
    Instant uploadedAt
) {}
