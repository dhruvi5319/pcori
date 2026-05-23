package com.pcori.platform.domain.classification.dto;

import com.pcori.platform.domain.classification.ClassificationStatus;

import java.time.LocalDate;

public record ClassificationFilters(
    ClassificationStatus status,
    LocalDate startDate,
    LocalDate endDate,
    String pcc,
    String q
) {}
