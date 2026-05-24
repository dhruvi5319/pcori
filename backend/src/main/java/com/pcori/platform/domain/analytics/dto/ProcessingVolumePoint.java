package com.pcori.platform.domain.analytics.dto;

public record ProcessingVolumePoint(
        String bucket,
        long count
) {}
