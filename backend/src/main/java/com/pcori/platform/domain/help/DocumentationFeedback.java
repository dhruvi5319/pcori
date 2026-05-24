package com.pcori.platform.domain.help;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documentation_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentationFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // NOT @ManyToOne — stored as UUID column to avoid circular load
    @Column(name = "article_id", nullable = false)
    private UUID articleId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private Boolean helpful;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    // NOTE: UNIQUE(article_id, user_id) enforced by DB — handle DataIntegrityViolationException in service

    @PrePersist
    protected void onCreate() {
        submittedAt = Instant.now();
    }
}
