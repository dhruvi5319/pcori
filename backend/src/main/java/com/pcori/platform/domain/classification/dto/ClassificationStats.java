package com.pcori.platform.domain.classification.dto;

import java.math.BigDecimal;

/**
 * Projection for classification statistics aggregate query.
 */
public record ClassificationStats(
        Long total,
        Long classified,
        Long processing,
        Long pending,
        Long failed,
        Long needsReview,
        BigDecimal avgConfidenceScore
) {}
