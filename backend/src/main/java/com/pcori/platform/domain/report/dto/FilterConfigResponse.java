package com.pcori.platform.domain.report.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response for filter configuration endpoints.
 */
public record FilterConfigResponse(
    UUID id,
    String name,
    String criteriaJson,
    Instant createdAt,
    Instant updatedAt
) {}
