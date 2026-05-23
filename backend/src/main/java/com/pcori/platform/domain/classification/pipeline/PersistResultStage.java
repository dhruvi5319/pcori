package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.integration.ml.ClassificationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Stage 3 of ClassificationPipeline: persist the final classification result.
 */
@Component
@RequiredArgsConstructor
public class PersistResultStage {

    private final ClassificationRepository classificationRepository;

    public void persist(Classification classification, ClassificationResult result, long processingTimeMs) {
        classification.setPcc(result.pcc());
        classification.setTaxonomyCategory(result.taxonomyCategory());
        classification.setTaxonomyCode(result.taxonomyCode());
        classification.setTaxonomySubcode(result.taxonomySubcode());
        classification.setProjectSummary(result.projectSummary());
        classification.setPopulationSetting(result.populationSetting());
        classification.setIntervention(result.intervention());
        classification.setComparator(result.comparator());
        classification.setPrimaryOutcome(result.primaryOutcome());
        classification.setSecondaryOutcomes(result.secondaryOutcomes());
        classification.setConfidenceScore(BigDecimal.valueOf(result.confidenceScore()));
        classification.setModelVersion(result.modelVersion());
        classification.setProcessingTimeMs((int) processingTimeMs);
        classification.setClassifiedAt(Instant.now());
        classificationRepository.save(classification);
    }
}
