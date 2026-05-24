package com.pcori.platform.domain.pipeline.dto;

public record DbHealthDto(int activeConnections, int idleConnections, int maxConnections, int queueDepth) {}
