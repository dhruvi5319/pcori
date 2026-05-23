package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.ClassificationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ClassificationResponse(
    UUID id,
    String planId,
    String title,
    ClassificationStatus status,
    String pcc,
    String taxonomyCategory,
    String taxonomyCode,
    String taxonomySubcode,
    String primaryCondition,
    String projectSummary,
    String textPreview,
    String extractionWarning,
    BigDecimal confidenceScore,
    String modelVersion,
    Integer processingTimeMs,
    String fileName,
    Long fileSize,
    String notes,
    UUID uploadedBy,
    Instant uploadedAt,
    Instant classifiedAt,
    UUID reviewedBy,
    Instant reviewedAt,
    String overrideReason,
    String errorMessage,
    Instant createdAt,
    Instant updatedAt
) {}
