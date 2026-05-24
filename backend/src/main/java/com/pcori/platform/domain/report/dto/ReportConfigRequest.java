package com.pcori.platform.domain.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for POST /api/reports and POST /api/reports/templates.
 */
public record ReportConfigRequest(
    @NotBlank @Size(max = 100) String name,
    List<String> columns,
    String filtersJson
) {}
