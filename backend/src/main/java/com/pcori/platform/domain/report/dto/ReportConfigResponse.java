package com.pcori.platform.domain.report.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response for report configuration (named template) endpoints.
 */
public record ReportConfigResponse(
    UUID id,
    String name,
    List<String> columns,
    String filtersJson,
    Instant createdAt,
    Instant updatedAt
) {}
