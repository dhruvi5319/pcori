package com.pcori.platform.domain.pipeline.dto;

import java.time.Instant;
import java.util.UUID;

public record PipelineLogDto(UUID id, UUID runId, String level, String message, Instant loggedAt) {}
