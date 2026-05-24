package com.pcori.platform.domain.pipeline.dto;

import java.time.Instant;

public record PipelineStageDto(
    String name,            // EXTRACT, CLASSIFY, PERSIST
    String state,           // RUNNING, IDLE, FAILED
    Instant lastRunAt,
    long lastDurationMs,
    int stuckCount,
    String errorMessage
) {}
