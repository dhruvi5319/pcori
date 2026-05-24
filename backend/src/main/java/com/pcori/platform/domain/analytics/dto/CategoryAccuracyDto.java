package com.pcori.platform.domain.analytics.dto;

public record CategoryAccuracyDto(
        String category,
        long total,
        long overrideCount,
        double overrideRate
) {}
