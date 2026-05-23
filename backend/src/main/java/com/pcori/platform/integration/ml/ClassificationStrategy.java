package com.pcori.platform.integration.ml;

import com.pcori.platform.domain.taxonomy.TaxonomyCategory;

import java.util.List;

/**
 * Strategy interface for classification implementations.
 * Default: KeywordClassificationStrategy ("keyword-v1").
 * Future: Spring AI / OpenAI / Anthropic / AWS Bedrock swap.
 */
public interface ClassificationStrategy {

    ClassificationResult classify(String extractedText, List<TaxonomyCategory> activeCategories);
}
