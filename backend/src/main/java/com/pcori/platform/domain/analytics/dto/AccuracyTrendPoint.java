package com.pcori.platform.domain.analytics.dto;

public record AccuracyTrendPoint(
        String bucket,
        double aiAccuracy,
        double humanCorrectedAccuracy,
        long total
) {}
