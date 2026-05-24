package com.pcori.platform.domain.report;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for report_configurations table (V8 DDL).
 * Represents saved named report templates owned by a user.
 */
@Entity
@Table(name = "report_configurations")
@SQLRestriction("deleted_at IS NULL")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class ReportConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Owner of this report template — stored as UUID reference (no ManyToOne to avoid circular load).
     */
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    /**
     * JSONB column: ordered list of selected column names as JSON array.
     * E.g. '["Plan ID","Title","Status"]'
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "columns", nullable = false, columnDefinition = "jsonb")
    private String columns = "[]";

    /**
     * JSONB column: filter criteria as JSON object.
     * E.g. '{"status":"CLASSIFIED","pcc":"Primary Care"}'
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filters", nullable = false, columnDefinition = "jsonb")
    private String filters = "{}";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
