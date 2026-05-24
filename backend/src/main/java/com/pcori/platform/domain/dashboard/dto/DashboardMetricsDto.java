package com.pcori.platform.domain.dashboard.dto;

/**
 * Response DTO for dashboard metrics (FR-4.1, FR-4.2, FR-4.6).
 * Returned by GET /api/dashboard/metrics and GET /api/dashboard/metrics/range.
 */
public record DashboardMetricsDto(
        long total,
        long classified,
        long processing,
        long pending,
        long failed,
        long needsReview,
        double avgConfidence
) {}
