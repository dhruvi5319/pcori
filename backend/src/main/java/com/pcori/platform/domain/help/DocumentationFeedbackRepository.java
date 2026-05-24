package com.pcori.platform.domain.help;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DocumentationFeedbackRepository extends JpaRepository<DocumentationFeedback, UUID> {

    boolean existsByArticleIdAndUserId(UUID articleId, UUID userId);

    long countByArticleIdAndHelpfulTrue(UUID articleId);

    long countByArticleIdAndHelpfulFalse(UUID articleId);
}
