package com.pcori.platform.domain.report.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response for Excel report generation/retrieval endpoints.
 */
public record ExcelReportResponse(
    UUID id,
    UUID configurationId,
    String status,
    Instant generatedAt,
    String filePath,
    String errorMessage,
    Instant createdAt
) {}
