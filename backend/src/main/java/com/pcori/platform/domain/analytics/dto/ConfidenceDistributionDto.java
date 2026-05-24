package com.pcori.platform.domain.analytics.dto;

public record ConfidenceDistributionDto(
        String bucket,
        double low,
        double high,
        long count
) {}
