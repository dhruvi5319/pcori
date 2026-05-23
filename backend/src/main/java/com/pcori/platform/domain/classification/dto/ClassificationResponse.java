package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Full classification response DTO — maps all Classification entity fields.
 */
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
        String secondaryConditions,
        String icdCodes,
        String projectSummary,
        String populationSetting,
        String intervention,
        String comparator,
        String primaryOutcome,
        String secondaryOutcomes,
        String textPreview,
        String extractionWarning,
        Double confidenceScore,
        String modelVersion,
        Integer processingTimeMs,
        UUID fileId,
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
) {
    /**
     * Factory method to map a Classification entity to this DTO.
     */
    public static ClassificationResponse from(Classification c) {
        return new ClassificationResponse(
                c.getId(),
                c.getPlanId(),
                c.getTitle(),
                c.getStatus(),
                c.getPcc(),
                c.getTaxonomyCategory(),
                c.getTaxonomyCode(),
                c.getTaxonomySubcode(),
                c.getPrimaryCondition(),
                c.getSecondaryConditions(),
                c.getIcdCodes(),
                c.getProjectSummary(),
                c.getPopulationSetting(),
                c.getIntervention(),
                c.getComparator(),
                c.getPrimaryOutcome(),
                c.getSecondaryOutcomes(),
                c.getTextPreview(),
                c.getExtractionWarning(),
                c.getConfidenceScore() != null ? c.getConfidenceScore().doubleValue() : null,
                c.getModelVersion(),
                c.getProcessingTimeMs(),
                c.getFileId(),
                c.getFileName(),
                c.getFileSize(),
                c.getNotes(),
                c.getUploadedBy(),
                c.getUploadedAt(),
                c.getClassifiedAt(),
                c.getReviewedBy(),
                c.getReviewedAt(),
                c.getOverrideReason(),
                c.getErrorMessage(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
