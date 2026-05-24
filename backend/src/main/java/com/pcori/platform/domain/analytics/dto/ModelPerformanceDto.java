package com.pcori.platform.domain.analytics.dto;

public record ModelPerformanceDto(
        double precision,
        double recall,
        double f1Score,
        long totalEvaluated
) {}
