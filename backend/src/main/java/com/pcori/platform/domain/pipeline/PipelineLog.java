package com.pcori.platform.domain.pipeline;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pipeline_logs")
@Getter
@Setter
@NoArgsConstructor
public class PipelineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "run_id")
    private UUID runId;

    @Column(nullable = false)
    private String level;

    @Column(nullable = false)
    private String message;

    @Column(name = "logged_at")
    private Instant loggedAt = Instant.now();
}
