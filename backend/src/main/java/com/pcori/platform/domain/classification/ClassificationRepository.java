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

    // Statistics aggregate
    @Query("SELECT new com.pcori.platform.domain.classification.dto.ClassificationStats(" +
        "COUNT(c), " +
        "SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.CLASSIFIED THEN 1L ELSE 0L END), " +
        "SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.PROCESSING THEN 1L ELSE 0L END), " +
        "SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.PENDING THEN 1L ELSE 0L END), " +
        "SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.FAILED THEN 1L ELSE 0L END), " +
        "SUM(CASE WHEN c.status = com.pcori.platform.domain.classification.ClassificationStatus.NEEDS_REVIEW THEN 1L ELSE 0L END), " +
        "AVG(c.confidenceScore)) FROM Classification c WHERE c.deletedAt IS NULL")
    ClassificationStats getStatistics();
}
