package com.pcori.platform.domain.classification;

import com.pcori.platform.domain.classification.dto.ClassificationStats;
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

    // Startup recovery: stuck PROCESSING records
    @Query("SELECT c FROM Classification c WHERE c.status = com.pcori.platform.domain.classification.ClassificationStatus.PROCESSING AND c.updatedAt < :cutoff")
    List<Classification> findStuckProcessing(@Param("cutoff") Instant cutoff);

    // Recent N for dashboard feed — use @Query with LIMIT for dynamic N
    @Query("SELECT c FROM Classification c ORDER BY c.uploadedAt DESC LIMIT :limit")
    List<Classification> findRecentByLimit(@Param("limit") int limit);

    // Statistics aggregate
    @Query("SELECT new com.pcori.platform.domain.classification.dto.ClassificationStats(" +
           "COUNT(c), " +
           "SUM(CASE WHEN c.status = 'CLASSIFIED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN c.status = 'PROCESSING' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN c.status = 'PENDING' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN c.status = 'FAILED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN c.status = 'NEEDS_REVIEW' THEN 1 ELSE 0 END), " +
           "AVG(c.confidenceScore)) FROM Classification c")
    ClassificationStats getStatistics();
}
