package com.pcori.platform.integration.ml;

import com.pcori.platform.domain.taxonomy.TaxonomyCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Keyword-based classification strategy.
 * Matches extracted PDF text against taxonomy category names and descriptions.
 * Model version: keyword-v1
 * Confidence: 0.30 (no match) → up to 0.95 (strong keyword hits)
 */
@Component
@Slf4j
public class KeywordClassificationStrategy implements ClassificationStrategy {

    @Override
    public ClassificationResult classify(String extractedText, List<TaxonomyCategory> activeCategories) {
        if (extractedText == null || extractedText.isBlank()) {
            return emptyResult();
        }
        String text = extractedText.toLowerCase();

        // Find best matching PCC (level 0) by keyword hits
        TaxonomyCategory bestPcc = activeCategories.stream()
            .filter(c -> c.getLevel() == 0 && Boolean.TRUE.equals(c.getIsActive()))
            .max(Comparator.comparingInt(c -> countKeywordHits(text, c)))
            .orElse(null);

        // Find best matching category (level 1) under the winning PCC
        TaxonomyCategory bestCategory = null;
        if (bestPcc != null) {
            final TaxonomyCategory pccRef = bestPcc;
            bestCategory = activeCategories.stream()
                .filter(c -> c.getLevel() == 1
                    && Boolean.TRUE.equals(c.getIsActive())
                    && c.getParent() != null
                    && c.getParent().getId().equals(pccRef.getId()))
                .max(Comparator.comparingInt(c -> countKeywordHits(text, c)))
                .orElse(null);
        }

        double confidence = calculateConfidence(text, bestPcc, bestCategory);
        log.debug("KeywordClassification: pcc={}, confidence={:.2f}",
            bestPcc != null ? bestPcc.getCode() : "null", confidence);

        return new ClassificationResult(
            bestPcc != null ? bestPcc.getCode() : null,
            bestCategory != null ? bestCategory.getName() : null,
            bestCategory != null ? bestCategory.getCode() : null,
            null,
            safeExtractSentences(text, 2),
            null,
            null,
            null,
            safeExtractSentences(text, 1),
            null,
            confidence,
            "keyword-v1"
        );
    }

    private int countKeywordHits(String text, TaxonomyCategory category) {
        int hits = 0;
        if (category.getName() != null) {
            for (String kw : category.getName().toLowerCase().split("\\s+")) {
                if (kw.length() > 3 && text.contains(kw)) hits++;
            }
        }
        if (category.getDescription() != null) {
            for (String kw : category.getDescription().toLowerCase().split("\\s+")) {
                if (kw.length() > 3 && text.contains(kw)) hits++;
            }
        }
        return hits;
    }

    private double calculateConfidence(String text, TaxonomyCategory pcc, TaxonomyCategory category) {
        if (pcc == null) return 0.30;
        int pccHits = countKeywordHits(text, pcc);
        int catHits = category != null ? countKeywordHits(text, category) : 0;
        // Score: base 0.50 + up to 0.35 for PCC hits + up to 0.15 for category hits
        double score = 0.50 + Math.min(pccHits * 0.07, 0.35) + Math.min(catHits * 0.05, 0.15);
        return Math.min(score, 0.95); // cap at 0.95 — keyword never claims 100%
    }

    private String safeExtractSentences(String text, int count) {
        if (text == null || text.isBlank()) return null;
        try {
            String[] sentences = text.split("[.!?]\\s+");
            String result = Arrays.stream(sentences)
                .filter(s -> s.length() > 20)
                .limit(count)
                .collect(Collectors.joining(". "));
            return result.isEmpty() ? null : result.substring(0, Math.min(500, result.length()));
        } catch (Exception e) {
            return null;
        }
    }

    private ClassificationResult emptyResult() {
        return new ClassificationResult(null, null, null, null, null, null, null, null, null, null, 0.30, "keyword-v1");
    }
}
