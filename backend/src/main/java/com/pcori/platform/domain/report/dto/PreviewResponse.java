package com.pcori.platform.domain.report.dto;

import java.util.List;
import java.util.Map;

/**
 * Response for GET /api/reports/preview.
 * Returns total row count and up to 3 sample rows.
 */
public record PreviewResponse(
    long totalRows,
    List<Map<String, Object>> sampleRows
) {}
