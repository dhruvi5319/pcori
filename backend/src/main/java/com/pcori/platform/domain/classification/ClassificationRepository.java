package com.pcori.platform.domain.classification;

import com.pcori.platform.domain.classification.dto.ClassificationStats;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClassificationRepository
    extends JpaRepository<Classification, UUID>, JpaSpecificationExecutor<Classification> {

    Optional<Classification> findByPlanId(String planId);

    // Startup recovery: stuck PROCESSING records older than cutoff
    @Query("SELECT c FROM Classification c WHERE c.status = com.pcori.platform.domain.classification.ClassificationStatus.PROCESSING AND c.updatedAt < :cutoff")
    List<Classification> findStuckProcessing(@Param("cutoff") Instant cutoff);

    // Recent N for dashboard feed
    List<Classification> findTop10ByOrderByUploadedAtDesc();

    List<Classification> findByOrderByUploadedAtDesc(Pageable pageable);

    // Pipeline monitoring: count by status (deletedAt filter applied via @SQLRestriction)
    long countByStatus(ClassificationStatus status);

    // Pipeline monitoring: find all by status for dispatch (deletedAt filter applied via @SQLRestriction)
    List<Classification> findByStatus(ClassificationStatus status);

    // Pipeline monitoring: count stuck PROCESSING records older than threshold
    @Query("SELECT COUNT(c) FROM Classification c WHERE c.status = com.pcori.platform.domain.classification.ClassificationStatus.PROCESSING AND c.deletedAt IS NULL AND c.updatedAt < :threshold")
    long countStuckProcessing(@Param("threshold") Instant threshold);

    // Statistics aggregate
    @Query("SELECT new com.pcori.platform.domain.classification.dto.ClassificationStats(" +
        "COUNT(c), " +
        "COALESCE(SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.CLASSIFIED THEN 1L ELSE 0L END), 0L), " +
        "COALESCE(SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.PROCESSING THEN 1L ELSE 0L END), 0L), " +
        "COALESCE(SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.PENDING THEN 1L ELSE 0L END), 0L), " +
        "COALESCE(SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.FAILED THEN 1L ELSE 0L END), 0L), " +
        "COALESCE(SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.NEEDS_REVIEW THEN 1L ELSE 0L END), 0L), " +
        "AVG(c.confidenceScore)) FROM Classification c WHERE c.deletedAt IS NULL")
    ClassificationStats getStatistics();

    // Dashboard date-range metrics (FR-4.6)
    long countByUploadedAtBetweenAndDeletedAtIsNull(Instant start, Instant end);

    long countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(ClassificationStatus status, Instant start, Instant end);

    @Query("SELECT COALESCE(AVG(c.confidenceScore), 0.0) FROM Classification c " +
           "WHERE c.deletedAt IS NULL AND c.uploadedAt >= :start AND c.uploadedAt <= :end")
    double findAvgConfidenceForRange(@Param("start") Instant start, @Param("end") Instant end);
}
