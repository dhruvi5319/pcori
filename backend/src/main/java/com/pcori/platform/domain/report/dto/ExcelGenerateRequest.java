package com.pcori.platform.domain.report.dto;

import java.util.List;
import java.util.UUID;

/**
 * Request body for POST /api/excel/generate.
 * Specifies which columns to include and filter criteria for the Excel report.
 */
public record ExcelGenerateRequest(
    List<String> columns,
    String filtersJson,
    UUID configurationId
) {}
