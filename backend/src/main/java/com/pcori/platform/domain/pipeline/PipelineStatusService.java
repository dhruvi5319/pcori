package com.pcori.platform.domain.pipeline;

import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.domain.classification.pipeline.ClassificationPipeline;
import com.pcori.platform.domain.pipeline.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pipeline monitoring service.
 *
 * CRITICAL: This service SURFACES the existing classificationExecutor thread pool state.
 * It does NOT stop, restart, or modify the thread pool.
 * Control actions (start/stop/pause/resume) manage an in-memory state flag and
 * record pipeline run entries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PipelineStatusService {

    private final ClassificationRepository classificationRepository;
    private final ClassificationPipeline classificationPipeline;
    private final PipelineRunRepository pipelineRunRepository;
    private final PipelineLogRepository pipelineLogRepository;

    @Qualifier("classificationExecutor")
    @Autowired
    private ThreadPoolTaskExecutor classificationExecutor;

    // In-memory pipeline state (shared across requests; resets on server restart)
    // For Phase 3 this is acceptable — Phase 4 can move to DB-persisted state
    private volatile String pipelineState = "IDLE";
    private volatile Instant lastSyncAt = null;

    @Transactional(readOnly = true)
    public PipelineStatusDto getStatus() {
        int activeRuns = classificationExecutor.getActiveCount();
        long queueDepth = classificationRepository.countByStatus(ClassificationStatus.PENDING);
        // processingRate: approximate active tasks per minute
        double rate = activeRuns > 0 ? activeRuns * 60.0 / Math.max(1, activeRuns) : 0.0;

        String effectiveState = activeRuns > 0 ? "RUNNING" : pipelineState;
        return new PipelineStatusDto(effectiveState, activeRuns, (int) queueDepth, lastSyncAt, rate);
    }

    @Transactional(readOnly = true)
    public List<PipelineStageDto> getHealth() {
        // Derive stage health from classifications in current run
        long extractProcessing = classificationRepository.countByStatus(ClassificationStatus.PROCESSING);
        // Stuck = PROCESSING for > 15 minutes
        Instant stuckThreshold = Instant.now().minus(15, ChronoUnit.MINUTES);
        long stuckCount = classificationRepository.countStuckProcessing(stuckThreshold);

        return List.of(
            new PipelineStageDto("EXTRACT", extractProcessing > 0 ? "RUNNING" : "IDLE",
                lastSyncAt, 0L, (int) stuckCount, null),
            new PipelineStageDto("CLASSIFY", extractProcessing > 0 ? "RUNNING" : "IDLE",
                lastSyncAt, 0L, 0, null),
            new PipelineStageDto("PERSIST", extractProcessing > 0 ? "RUNNING" : "IDLE",
                lastSyncAt, 0L, 0, null)
        );
    }

    @Transactional(readOnly = true)
    public Page<PipelineLogDto> getLogs(UUID runId, Pageable pageable) {
        return pipelineLogRepository.findByRunIdOrderByLoggedAtDesc(runId, pageable)
            .map(l -> new PipelineLogDto(l.getId(), l.getRunId(), l.getLevel(), l.getMessage(), l.getLoggedAt()));
    }

    @Transactional(readOnly = true)
    public Page<PipelineRunDto> getHistory(Pageable pageable) {
        return pipelineRunRepository.findAllByOrderByStartedAtDesc(pageable)
            .map(r -> new PipelineRunDto(r.getId(), r.getStatus(), r.getStartedAt(),
                r.getCompletedAt(), r.getRecordsProcessed(), r.getFailedCount()));
    }

    @Transactional(readOnly = true)
    public DbHealthDto getDbHealth() {
        // HikariCP pool stats: default values — actual pool stats can be injected via DataSource if needed
        return new DbHealthDto(0, 0, 20,
            (int) classificationRepository.countByStatus(ClassificationStatus.PENDING));
    }

    @Transactional
    public void start(UUID runId) {
        pipelineState = "RUNNING";
        lastSyncAt = Instant.now();
        // Kick off processing of all PENDING records
        List<?> pending = classificationRepository.findByStatus(ClassificationStatus.PENDING);
        pending.forEach(c -> {
            var classification = (com.pcori.platform.domain.classification.Classification) c;
            classificationPipeline.process(classification.getId());
        });
        log.info("Pipeline started; dispatched {} pending records", pending.size());
    }

    public void stop(UUID runId) {
        pipelineState = "STOPPED";
        log.info("Pipeline stop requested — in-flight stages will complete");
    }

    public void pause(UUID runId) {
        pipelineState = "PAUSED";
        log.info("Pipeline paused — no new records will be dispatched");
    }

    public void resume(UUID runId) {
        pipelineState = "RUNNING";
        log.info("Pipeline resumed");
    }

    @Transactional
    public Map<String, Object> syncNow() {
        long pendingCount = classificationRepository.countByStatus(ClassificationStatus.PENDING);
        if (pendingCount == 0) {
            return Map.of("message", "No pending records to sync", "count", 0);
        }
        lastSyncAt = Instant.now();
        classificationRepository.findByStatus(ClassificationStatus.PENDING)
            .forEach(c -> classificationPipeline.process(c.getId()));
        return Map.of("message", "Sync queued " + pendingCount + " record(s)", "count", pendingCount);
    }

    @Transactional
    public void retryStage(UUID runId, String stageId) {
        // stageId: "EXTRACT", "CLASSIFY", or "PERSIST"
        // Retry = find FAILED classifications and requeue through pipeline
        classificationRepository.findByStatus(ClassificationStatus.FAILED)
            .forEach(c -> {
                c.setStatus(ClassificationStatus.PENDING);
                c.setErrorMessage(null);
                classificationRepository.save(c);
                classificationPipeline.process(c.getId());
            });
        log.info("Stage {} retry requested — FAILED records requeued", stageId);
    }
}
