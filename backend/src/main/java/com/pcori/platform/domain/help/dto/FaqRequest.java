package com.pcori.platform.domain.help.dto;

import jakarta.validation.constraints.NotBlank;

public record FaqRequest(
        @NotBlank String question,
        @NotBlank String answer,
        @NotBlank String category,
        int displayOrder
) {
}
