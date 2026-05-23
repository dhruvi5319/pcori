package com.pcori.platform.domain.classification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/classifications/{id}/override (FR-2.6).
 * overrideReason is mandatory — validated via @Valid on controller.
 */
public record ManualOverrideRequest(
        String pcc,
        String taxonomyCategory,
        String taxonomyCode,
        String taxonomySubcode,
        @NotBlank @Size(min = 1, max = 2000) String overrideReason
) {}
