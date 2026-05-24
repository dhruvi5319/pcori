package com.pcori.platform.domain.help.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record FeedbackRequest(
        @NotNull UUID articleId,
        @NotNull Boolean helpful,
        String comment  // optional
) {
}
