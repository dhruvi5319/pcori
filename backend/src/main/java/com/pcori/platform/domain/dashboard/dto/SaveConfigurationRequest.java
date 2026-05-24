package com.pcori.platform.domain.dashboard.dto;

import java.util.Map;

/**
 * Request body for POST/PUT /api/dashboard/configuration (FR-4.5).
 */
public record SaveConfigurationRequest(
        Map<String, Object> layout,
        Map<String, Object> widgets
) {}
