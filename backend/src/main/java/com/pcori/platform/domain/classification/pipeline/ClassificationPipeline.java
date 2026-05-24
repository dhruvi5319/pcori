package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.domain.notification.NotificationService;
import com.pcori.platform.domain.notification.NotificationType;
import com.pcori.platform.integration.ml.ClassificationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Async 3-stage classification pipeline:
 * Stage 1: PDF text extraction (PDFBox)
 * Stage 2: Classification (KeywordClassificationStrategy)
 * Stage 3: Persist result
 *
 * Runs on the "classificationExecutor" thread pool with SecurityContextPropagatingDecorator
 * to ensure audit fields (createdBy / lastModifiedBy) are populated in async threads.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClassificationPipeline {

    private final ClassificationRepository classificationRepository;
    private final PdfExtractionStage extractionStage;
    private final ClassificationStage classificationStage;
    private final PersistResultStage persistStage;
    private final NotificationService notificationService;

    @Async("classificationExecutor")
    public void process(UUID classificationId) {
        long startTime = System.currentTimeMillis();
        log.info("Pipeline starting for classification {}", classificationId);

        Classification classification = classificationRepository.findById(classificationId)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Classification " + classificationId + " not found for pipeline processing"));

        try {
            // Mark as PROCESSING
            classification.setStatus(ClassificationStatus.PROCESSING);
            classificationRepository.save(classification);

            // Stage 1: Extract text from PDF
            String text = extractionStage.extract(classification);
            if (text == null) {
                // Quality gate failed — extractionWarning already set on entity
                classification.setStatus(ClassificationStatus.NEEDS_REVIEW);
                classificationRepository.save(classification);
                log.info("Pipeline completed for {} with status NEEDS_REVIEW (extraction quality gate)", classificationId);
                notificationService.dispatch(
                    classification.getUploadedBy(),
                    NotificationType.CLASSIFICATION_NEEDS_REVIEW,
                    "Classification Needs Review",
                    "Plan " + classification.getPlanId() + " requires manual review."
                );
                return;
            }

            // Stage 2: Classify
            ClassificationResult result = classificationStage.classify(text);
            ClassificationStatus finalStatus = classificationStage.determineStatus(result.confidenceScore());

            // Stage 3: Persist
            classification.setStatus(finalStatus);
            persistStage.persist(classification, result, System.currentTimeMillis() - startTime);

            log.info("Pipeline completed for {} with status {} confidence={} in {}ms",
                classificationId, finalStatus,
                String.format("%.2f", result.confidenceScore()),
                System.currentTimeMillis() - startTime);

            // Dispatch notification based on final status
            if (finalStatus == ClassificationStatus.CLASSIFIED) {
                notificationService.dispatch(
                    classification.getUploadedBy(),
                    NotificationType.CLASSIFICATION_COMPLETED,
                    "Classification Complete",
                    "Plan " + classification.getPlanId() + " has been classified successfully."
                );
            } else if (finalStatus == ClassificationStatus.NEEDS_REVIEW) {
                notificationService.dispatch(
                    classification.getUploadedBy(),
                    NotificationType.CLASSIFICATION_NEEDS_REVIEW,
                    "Classification Needs Review",
                    "Plan " + classification.getPlanId() + " has low confidence and requires review."
                );
            }

        } catch (Exception e) {
            log.error("Pipeline failed for classification {}: {}", classificationId, e.getMessage(), e);
            try {
                classification.setStatus(ClassificationStatus.FAILED);
                classification.setErrorMessage(e.getMessage());
                classificationRepository.save(classification);
                notificationService.dispatch(
                    classification.getUploadedBy(),
                    NotificationType.CLASSIFICATION_FAILED,
                    "Classification Failed",
                    "Plan " + classification.getPlanId() + " failed to classify: " + e.getMessage()
                );
            } catch (Exception saveEx) {
                log.error("Failed to persist FAILED status for {}: {}", classificationId, saveEx.getMessage());
            }
        }
    }
}
