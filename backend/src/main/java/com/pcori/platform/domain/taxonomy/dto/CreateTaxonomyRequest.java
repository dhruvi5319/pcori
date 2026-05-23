package com.pcori.platform.domain.taxonomy.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTaxonomyRequest(
    @NotBlank @Size(min = 1, max = 50) String code,
    @NotBlank @Size(min = 1, max = 255) String name,
    @Size(max = 2000) String description,
    UUID parentId,
    @NotNull @Min(0) @Max(3) Integer level,
    Integer displayOrder
) {}
