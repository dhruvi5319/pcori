package com.pcori.platform.domain.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/filters.
 */
public record FilterConfigRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank String criteriaJson
) {}
