package com.pcori.platform.domain.dashboard.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for dashboard configuration (FR-4.5).
 * Returned by GET/PUT/POST /api/dashboard/configuration.
 */
public record DashboardConfigurationDto(
        UUID id,
        UUID userId,
        Map<String, Object> layout,
        Map<String, Object> widgets,
        Instant createdAt,
        Instant updatedAt
) {}
