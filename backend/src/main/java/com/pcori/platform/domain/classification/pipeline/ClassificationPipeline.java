package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.integration.ml.ClassificationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Async 3-stage classification pipeline orchestrator (FR-2.2).
 * Runs on "classificationExecutor" pool with SecurityContextPropagatingDecorator
 * to ensure audit fields (createdBy, lastModifiedBy) are non-null in async threads.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClassificationPipeline {

    private final ClassificationRepository classificationRepository;
    private final PdfExtractionStage extractionStage;
    private final ClassificationStage classificationStage;
    private final PersistResultStage persistStage;

    @Async("classificationExecutor")
    public void process(UUID classificationId) {
        long startTime = System.currentTimeMillis();
        Classification classification = classificationRepository.findById(classificationId)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "Classification " + classificationId));

        try {
            classification.setStatus(ClassificationStatus.PROCESSING);
            classificationRepository.save(classification);

            // Stage 1: Extract text from PDF
            String text = extractionStage.extract(classification);
            if (text == null) {
                // Quality gate failed — text is null, extractionWarning is set on entity
                classification.setStatus(ClassificationStatus.NEEDS_REVIEW);
                classificationRepository.save(classification);
                return;
            }

            // Stage 2: Classify extracted text
            ClassificationResult result = classificationStage.classify(text);
            ClassificationStatus finalStatus = classificationStage.determineStatus(result.confidenceScore());

            // Stage 3: Persist final state
            classification.setStatus(finalStatus);
            persistStage.persist(classification, result, System.currentTimeMillis() - startTime);
            log.info("Classification {} completed with status {} in {}ms",
                    classificationId, finalStatus, System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Pipeline failed for classification {}: {}", classificationId, e.getMessage());
            classification.setStatus(ClassificationStatus.FAILED);
            classification.setErrorMessage(e.getMessage());
            classificationRepository.save(classification);
        }
    }
}
