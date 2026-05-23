package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.ClassificationStatus;

import java.time.Instant;
import java.util.UUID;

public record UploadResponse(
    UUID classificationId,
    String planId,
    ClassificationStatus status,
    Instant uploadedAt
) {}
