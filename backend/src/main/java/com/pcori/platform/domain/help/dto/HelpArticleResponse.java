package com.pcori.platform.domain.help.dto;

import java.time.Instant;
import java.util.UUID;

public record HelpArticleResponse(
        UUID id,
        String title,
        String slug,
        String category,
        String content,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
