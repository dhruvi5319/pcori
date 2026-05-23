package com.pcori.platform.domain.classification.dto;

public record ClassificationStats(
    long total,
    long classified,
    long processing,
    long pending,
    long failed,
    long needsReview,
    Double averageConfidence
) {}
