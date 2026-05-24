package com.pcori.platform.domain.pipeline.dto;

import java.time.Instant;

public record PipelineStatusDto(
    String state,           // RUNNING, PAUSED, STOPPED, IDLE, FAILED
    int activeRuns,
    int queueDepth,
    Instant lastSyncAt,
    double processingRatePerMin
) {}
