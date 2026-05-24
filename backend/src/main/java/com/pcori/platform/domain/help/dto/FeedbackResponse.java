package com.pcori.platform.domain.help.dto;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(
        UUID id,
        UUID articleId,
        boolean helpful,
        String comment,
        Instant submittedAt,
        long helpfulCount,
        long notHelpfulCount
) {
}
