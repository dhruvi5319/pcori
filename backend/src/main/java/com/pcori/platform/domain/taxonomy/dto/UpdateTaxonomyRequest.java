package com.pcori.platform.domain.taxonomy.dto;

import jakarta.validation.constraints.Size;

public record UpdateTaxonomyRequest(
    @Size(min = 1, max = 50) String code,
    @Size(min = 1, max = 255) String name,
    @Size(max = 2000) String description,
    Integer displayOrder
) {}
