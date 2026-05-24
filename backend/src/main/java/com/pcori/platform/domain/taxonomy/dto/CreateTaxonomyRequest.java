package com.pcori.platform.domain.taxonomy.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record CreateTaxonomyRequest(
    @NotBlank @Size(min = 1, max = 50) String code,
    @NotBlank @Size(min = 1, max = 255) String name,
    @Size(max = 2000) String description,
    UUID parentId,
    @NotNull @Min(0) @Max(3) Integer level,
    Integer displayOrder
) {}
