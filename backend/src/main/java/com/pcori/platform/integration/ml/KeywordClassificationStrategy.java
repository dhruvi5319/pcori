package com.pcori.platform.integration.ml;

import com.pcori.platform.domain.taxonomy.TaxonomyCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Default ClassificationStrategy using taxonomy keyword matching.
 * Model version: "keyword-v1".
 * Confidence ≥0.75 → CLASSIFIED; <0.75 → NEEDS_REVIEW.
 */
@Component
@Slf4j
public class KeywordClassificationStrategy implements ClassificationStrategy {

    @Override
    public ClassificationResult classify(String extractedText, List<TaxonomyCategory> activeCategories) {
        String text = extractedText.toLowerCase();

        // Find best matching PCC (level 0) by counting keyword matches
        TaxonomyCategory bestPcc = activeCategories.stream()
                .filter(c -> c.getLevel() == 0)
                .max(Comparator.comparingInt(c -> countKeywordHits(text, c)))
                .orElse(null);

        // Find best matching category (level 1) under the PCC
        TaxonomyCategory bestCategory = activeCategories.stream()
                .filter(c -> c.getLevel() == 1 && bestPcc != null &&
                             c.getParent() != null && c.getParent().getId().equals(bestPcc.getId()))
                .max(Comparator.comparingInt(c -> countKeywordHits(text, c)))
                .orElse(null);

        // Calculate confidence: normalized hit count ratio
        double confidence = calculateConfidence(text, bestPcc, bestCategory);

        log.debug("Keyword classification: pcc={}, category={}, confidence={}",
                bestPcc != null ? bestPcc.getCode() : "null",
                bestCategory != null ? bestCategory.getCode() : "null",
                confidence);

        return new ClassificationResult(
                bestPcc != null ? bestPcc.getCode() : null,
                bestCategory != null ? bestCategory.getName() : null,
                bestCategory != null ? bestCategory.getCode() : null,
                null,   // subcode — requires level 2; extend in future iteration
                extractSentences(text, 2),   // project summary: first 2 sentences
                null, null, null,            // population, intervention, comparator
                extractSentences(text, 1),   // primary outcome: first sentence
                null,
                confidence,
                "keyword-v1"
        );
    }

    private int countKeywordHits(String text, TaxonomyCategory category) {
        int hits = 0;
        String[] keywords = category.getName().toLowerCase().split("\\s+");
        for (String kw : keywords) {
            if (kw.length() > 3 && text.contains(kw)) hits++;
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
        // Score: base 0.5 + up to 0.35 for PCC hits + up to 0.15 for category hits
        double score = 0.50 + Math.min(pccHits * 0.07, 0.35) + Math.min(catHits * 0.05, 0.15);
        return Math.min(score, 0.95);   // cap at 0.95 — keyword never claims 100%
    }

    private String extractSentences(String text, int count) {
        if (text == null || text.isBlank()) return null;
        String[] sentences = text.split("[.!?]\\s+");
        String joined = Arrays.stream(sentences)
                .filter(s -> s.length() > 20)
                .limit(count)
                .collect(Collectors.joining(". "));
        if (joined.isEmpty()) return null;
        return joined.substring(0, Math.min(500, joined.length()));
    }
}
