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
 * Startup recovery: resets stuck PROCESSING records to FAILED on JVM restart.
 * Mandatory safety net for @Async pipeline — if JVM crashes during processing,
 * records are left in PROCESSING state indefinitely without this recovery.
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
            log.info("Startup recovery: found {} stuck PROCESSING records older than {}min — marking FAILED",
                stuck.size(), stuckTimeoutMinutes);
            stuck.forEach(c -> {
                c.setStatus(ClassificationStatus.FAILED);
                c.setErrorMessage(
                    "Classification was stuck in PROCESSING state and reset during startup recovery");
            });
            classificationRepository.saveAll(stuck);
            log.info("Startup recovery: {} records reset to FAILED", stuck.size());
        } else {
            log.info("Startup recovery: no stuck PROCESSING records found");
        }
    }
}
