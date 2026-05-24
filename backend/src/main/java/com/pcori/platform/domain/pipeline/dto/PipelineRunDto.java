package com.pcori.platform.domain.pipeline.dto;

import java.time.Instant;
import java.util.UUID;

public record PipelineRunDto(UUID id, String status, Instant startedAt, Instant completedAt,
                              int recordsProcessed, int failedCount) {}
