package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.ClassificationStatus;

import java.time.LocalDate;

/**
 * Filter parameters for GET /api/classifications (FR-2.8).
 */
public record ClassificationFilters(
        ClassificationStatus status,
        LocalDate startDate,
        LocalDate endDate,
        String pcc,
        String q
) {}
