package com.pcori.platform.domain.taxonomy.dto;

import java.time.Instant;
import java.util.UUID;

public record TaxonomyCategoryDto(
    UUID id,
    String code,
    String name,
    String description,
    UUID parentId,
    String parentCode,
    boolean isActive,
    int level,
    int displayOrder,
    Instant createdAt,
    Instant updatedAt
) {}
