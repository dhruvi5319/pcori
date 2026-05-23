package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.domain.taxonomy.TaxonomyCategory;
import com.pcori.platform.domain.taxonomy.TaxonomyService;
import com.pcori.platform.integration.ml.ClassificationResult;
import com.pcori.platform.integration.ml.ClassificationStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stage 2 of ClassificationPipeline: run ClassificationStrategy and determine final status.
 */
@Component
@RequiredArgsConstructor
public class ClassificationStage {

    private final ClassificationStrategy classificationStrategy;
    private final TaxonomyService taxonomyService;

    @Value("${app.classification.needs-review-threshold:0.75}")
    private double needsReviewThreshold;

    public ClassificationResult classify(String extractedText) {
        List<TaxonomyCategory> activeCategories = taxonomyService.getActiveCategories();
        return classificationStrategy.classify(extractedText, activeCategories);
    }

    /**
     * Determines the final status based on confidence score.
     * confidence >= threshold → CLASSIFIED; < threshold → NEEDS_REVIEW
     */
    public ClassificationStatus determineStatus(double confidenceScore) {
        return confidenceScore >= needsReviewThreshold
                ? ClassificationStatus.CLASSIFIED
                : ClassificationStatus.NEEDS_REVIEW;
    }
}
