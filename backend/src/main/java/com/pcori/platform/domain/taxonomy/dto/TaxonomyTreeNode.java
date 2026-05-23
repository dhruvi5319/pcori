package com.pcori.platform.domain.taxonomy.dto;

import java.util.List;

public record TaxonomyTreeNode(
    TaxonomyCategoryDto category,
    List<TaxonomyTreeNode> children
) {}
