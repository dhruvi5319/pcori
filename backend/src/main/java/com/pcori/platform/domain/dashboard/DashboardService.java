package com.pcori.platform.domain.dashboard;

import com.pcori.platform.domain.classification.ClassificationRepository;
import com.pcori.platform.domain.classification.ClassificationStatus;
import com.pcori.platform.domain.classification.dto.ClassificationStats;
import com.pcori.platform.domain.dashboard.dto.DashboardConfigurationDto;
import com.pcori.platform.domain.dashboard.dto.DashboardMetricsDto;
import com.pcori.platform.domain.dashboard.dto.SaveConfigurationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

/**
 * Dashboard service implementing FR-4.1, FR-4.2, FR-4.3, FR-4.5, FR-4.6.
 *
 * <p>Metrics are sourced from the classifications table via ClassificationRepository.
 * For the non-date-range case we reuse the existing getStatistics() aggregate query
 * to avoid issuing 6 separate COUNT queries.
 * For the date-range case (FR-4.6) we use dedicated JPQL count queries with date filters.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class DashboardService {

    private final ClassificationRepository classificationRepository;
    private final DashboardConfigurationRepository configRepository;

    // ----------------------------------------------------------------
    // Metrics (FR-4.1, FR-4.2, FR-4.6)
    // ----------------------------------------------------------------

    /**
     * Returns aggregate KPI metrics over all non-deleted classifications.
     */
    @Transactional(readOnly = true)
    public DashboardMetricsDto getMetrics() {
        ClassificationStats stats = classificationRepository.getStatistics();
        double avg = stats.averageConfidence() != null ? stats.averageConfidence() : 0.0;
        return new DashboardMetricsDto(
                stats.total(),
                stats.classified(),
                stats.processing(),
                stats.pending(),
                stats.failed(),
                stats.needsReview(),
                avg
        );
    }

    /**
     * Returns aggregate KPI metrics scoped to the given date range (FR-4.6).
     */
    @Transactional(readOnly = true)
    public DashboardMetricsDto getMetricsForRange(Instant startDate, Instant endDate) {
        long total      = classificationRepository.countByUploadedAtBetweenAndDeletedAtIsNull(startDate, endDate);
        long classified = classificationRepository.countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(
                ClassificationStatus.CLASSIFIED, startDate, endDate);
        long processing = classificationRepository.countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(
                ClassificationStatus.PROCESSING, startDate, endDate);
        long pending    = classificationRepository.countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(
                ClassificationStatus.PENDING, startDate, endDate);
        long failed     = classificationRepository.countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(
                ClassificationStatus.FAILED, startDate, endDate);
        long needsReview = classificationRepository.countByStatusAndUploadedAtBetweenAndDeletedAtIsNull(
                ClassificationStatus.NEEDS_REVIEW, startDate, endDate);
        double avgConf  = classificationRepository.findAvgConfidenceForRange(startDate, endDate);
        return new DashboardMetricsDto(total, classified, processing, pending, failed, needsReview, avgConf);
    }

    // ----------------------------------------------------------------
    // Configuration persistence (FR-4.5)
    // ----------------------------------------------------------------

    /**
     * Returns the authenticated user's widget layout configuration, if any.
     */
    @Transactional(readOnly = true)
    public Optional<DashboardConfigurationDto> getConfiguration(UUID userId) {
        return configRepository.findByUserIdAndDeletedAtIsNull(userId)
                .map(this::toDto);
    }

    /**
     * Creates or updates (upsert) the user's widget layout configuration.
     */
    public DashboardConfigurationDto saveConfiguration(UUID userId, SaveConfigurationRequest req) {
        DashboardConfiguration config = configRepository
                .findByUserIdAndDeletedAtIsNull(userId)
                .orElseGet(() -> {
                    DashboardConfiguration c = new DashboardConfiguration();
                    c.setUserId(userId);
                    return c;
                });
        config.setLayout(req.layout() != null ? req.layout() : new HashMap<>());
        config.setWidgets(req.widgets());
        config.setUpdatedAt(Instant.now());
        DashboardConfiguration saved = configRepository.save(config);
        return toDto(saved);
    }

    /**
     * Soft-deletes the user's widget layout configuration (resets to defaults on next GET).
     */
    public void deleteConfiguration(UUID userId) {
        configRepository.findByUserIdAndDeletedAtIsNull(userId).ifPresent(c -> {
            c.setDeletedAt(Instant.now());
            configRepository.save(c);
        });
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    private DashboardConfigurationDto toDto(DashboardConfiguration c) {
        return new DashboardConfigurationDto(
                c.getId(),
                c.getUserId(),
                c.getLayout(),
                c.getWidgets(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
