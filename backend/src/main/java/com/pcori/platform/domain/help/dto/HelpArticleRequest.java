package com.pcori.platform.domain.help.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HelpArticleRequest(
        @NotBlank String title,
        @NotBlank @Size(max = 100) String slug,
        @NotBlank String category,
        @NotBlank String content
) {
}
