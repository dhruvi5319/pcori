package com.pcori.platform.domain.help.dto;

import java.time.Instant;
import java.util.UUID;

public record FaqResponse(
        UUID id,
        String question,
        String answer,
        String category,
        int displayOrder,
        Instant createdAt
) {
}
