package com.pcori.platform.integration.ml;

import com.pcori.platform.domain.taxonomy.TaxonomyCategory;

import java.util.List;

/**
 * Strategy interface for classifying research plan text against the PCORI taxonomy.
 * Default implementation: KeywordClassificationStrategy (keyword-v1).
 * Future: swap for Spring AI / ML provider implementation without changing callers.
 */
public interface ClassificationStrategy {
    ClassificationResult classify(String extractedText, List<TaxonomyCategory> activeCategories);
}
