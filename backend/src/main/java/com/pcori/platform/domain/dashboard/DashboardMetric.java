package com.pcori.platform.domain.dashboard;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Maps to dashboard_metrics table (V7 migration).
 * Stores historical metric snapshots (totals, rates, etc.).
 */
@Entity
@Table(name = "dashboard_metrics")
@Getter
@Setter
@NoArgsConstructor
public class DashboardMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal value;

    private String category;

    @Column(name = "recorded_at")
    private Instant recordedAt = Instant.now();
}
