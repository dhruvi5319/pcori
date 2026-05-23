package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.ClassificationStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Response from POST /api/classifications/upload (FR-2.1, FR-2.3).
 * Returns 202 Accepted with planId in RP-YYYY-### format.
 */
public record UploadResponse(
        UUID classificationId,
        String planId,
        ClassificationStatus status,
        Instant uploadedAt
) {}
