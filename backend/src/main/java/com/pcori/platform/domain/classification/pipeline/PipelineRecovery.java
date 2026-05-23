package com.pcori.platform.domain.classification.pipeline;

import com.pcori.platform.domain.classification.Classification;
import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Startup recovery: finds classifications stuck in PROCESSING state and marks them FAILED.
 * Per TechArch spec: @EventListener(ApplicationReadyEvent) to reset stuck records on boot.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PipelineRecovery {

    private final ClassificationRepository classificationRepository;

    @Value("${app.classification.stuck-timeout-minutes:15}")
    private int stuckTimeoutMinutes;

    @EventListener(ApplicationReadyEvent.class)
    public void recoverStuckRecords() {
        Instant cutoff = Instant.now().minus(stuckTimeoutMinutes, ChronoUnit.MINUTES);
        List<Classification> stuck = classificationRepository.findStuckProcessing(cutoff);
        if (!stuck.isEmpty()) {
            log.info("Startup recovery: found {} stuck PROCESSING records — marking FAILED", stuck.size());
            stuck.forEach(c -> {
                c.setStatus(ClassificationStatus.FAILED);
                c.setErrorMessage("Classification was stuck in PROCESSING state and reset during startup recovery");
            });
            classificationRepository.saveAll(stuck);
        }
    }
}
