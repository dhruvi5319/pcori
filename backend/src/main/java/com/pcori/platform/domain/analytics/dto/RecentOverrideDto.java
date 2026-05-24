package com.pcori.platform.domain.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record RecentOverrideDto(
        UUID classificationId,
        String planId,
        String reviewerUsername,
        String originalCategory,
        String overrideCategory,
        String overrideReason,
        Instant reviewedAt
) {}
