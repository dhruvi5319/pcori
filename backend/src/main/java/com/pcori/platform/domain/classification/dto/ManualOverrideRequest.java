package com.pcori.platform.domain.classification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManualOverrideRequest(
    String pcc,
    String taxonomyCategory,
    String taxonomyCode,
    String taxonomySubcode,
    @NotBlank @Size(min = 1, max = 2000) String overrideReason
) {}
