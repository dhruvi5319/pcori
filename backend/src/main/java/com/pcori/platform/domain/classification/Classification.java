package com.pcori.platform.domain.classification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "classifications")
@SQLRestriction("deleted_at IS NULL")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class Classification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_id", nullable = false, unique = true, length = 20)
    private String planId;

    @Column(name = "title", length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "classification_status")
    private ClassificationStatus status = ClassificationStatus.PENDING;

    @Column(name = "pcc", length = 255)
    private String pcc;

    @Column(name = "taxonomy_category", length = 255)
    private String taxonomyCategory;

    @Column(name = "taxonomy_code", length = 100)
    private String taxonomyCode;

    @Column(name = "taxonomy_subcode", length = 100)
    private String taxonomySubcode;

    @Column(name = "primary_condition", length = 255)
    private String primaryCondition;

    @Column(name = "secondary_conditions", columnDefinition = "TEXT")
    private String secondaryConditions;

    @Column(name = "icd_codes", columnDefinition = "TEXT")
    private String icdCodes;

    @Column(name = "project_summary", columnDefinition = "TEXT")
    private String projectSummary;

    @Column(name = "population_setting", columnDefinition = "TEXT")
    private String populationSetting;

    @Column(name = "intervention", columnDefinition = "TEXT")
    private String intervention;

    @Column(name = "comparator", columnDefinition = "TEXT")
    private String comparator;

    @Column(name = "primary_outcome", columnDefinition = "TEXT")
    private String primaryOutcome;

    @Column(name = "secondary_outcomes", columnDefinition = "TEXT")
    private String secondaryOutcomes;

    @Column(name = "text_preview", length = 500)
    private String textPreview;

    @Column(name = "extraction_warning", length = 255)
    private String extractionWarning;

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @Column(name = "model_version", length = 100)
    private String modelVersion;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();

    @Column(name = "classified_at")
    private Instant classifiedAt;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by")
    private String createdBy;

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // search_vector is a generated column — exclude from JPA writes
    @Column(name = "search_vector", insertable = false, updatable = false, columnDefinition = "tsvector")
    private String searchVector;
}
