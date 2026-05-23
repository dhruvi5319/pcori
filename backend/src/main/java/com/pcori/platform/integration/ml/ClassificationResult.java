package com.pcori.platform.integration.ml;

/**
 * Immutable result from a ClassificationStrategy execution.
 */
public record ClassificationResult(
        String pcc,
        String taxonomyCategory,
        String taxonomyCode,
        String taxonomySubcode,
        String projectSummary,
        String populationSetting,
        String intervention,
        String comparator,
        String primaryOutcome,
        String secondaryOutcomes,
        double confidenceScore,   // 0.0–1.0
        String modelVersion       // "keyword-v1"
) {}
