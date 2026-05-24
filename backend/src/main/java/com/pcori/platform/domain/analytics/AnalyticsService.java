package com.pcori.platform.domain.analytics;

import com.pcori.platform.domain.analytics.dto.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AnalyticsService {

    private final EntityManager em;

    public List<AccuracyTrendPoint> getAccuracyTrend(Instant startDate, Instant endDate, String granularity) {
        String trunc = switch (granularity.toLowerCase()) {
            case "week" -> "week";
            case "month" -> "month";
            default -> "day";
        };
        String sql = """
                SELECT
                    date_trunc(:trunc, uploaded_at) AS bucket,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'CLASSIFIED' AND reviewed_by IS NULL) AS ai_classified,
                    COUNT(*) FILTER (WHERE reviewed_by IS NOT NULL) AS human_corrected
                FROM classifications
                WHERE uploaded_at BETWEEN :start AND :end
                  AND deleted_at IS NULL
                GROUP BY 1
                ORDER BY 1 ASC
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("trunc", trunc);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream().map(r -> {
            long total = ((Number) r[1]).longValue();
            long aiClassified = ((Number) r[2]).longValue();
            long humanCorrected = ((Number) r[3]).longValue();
            double aiAccuracy = total > 0 ? (double) aiClassified / total : 0.0;
            double humanAccuracy = total > 0 ? (double) humanCorrected / total : 0.0;
            return new AccuracyTrendPoint(r[0].toString(), aiAccuracy, humanAccuracy, total);
        }).toList();
    }

    public List<CategoryAccuracyDto> getCategoryAccuracy(Instant startDate, Instant endDate) {
        String sql = """
                SELECT
                    COALESCE(pcc, 'Unknown') AS category,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE reviewed_by IS NOT NULL) AS override_count
                FROM classifications
                WHERE uploaded_at BETWEEN :start AND :end
                  AND deleted_at IS NULL
                GROUP BY 1
                ORDER BY override_count DESC
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream().map(r -> {
            String cat = (String) r[0];
            long total = ((Number) r[1]).longValue();
            long overrides = ((Number) r[2]).longValue();
            double rate = total > 0 ? (double) overrides / total : 0.0;
            return new CategoryAccuracyDto(cat, total, overrides, rate);
        }).toList();
    }

    public List<ConfidenceDistributionDto> getConfidenceDistribution(Instant startDate, Instant endDate) {
        String sql = """
                SELECT
                    width_bucket(confidence_score::numeric, 0, 1, 10) AS bucket_num,
                    COUNT(*) AS count
                FROM classifications
                WHERE uploaded_at BETWEEN :start AND :end
                  AND confidence_score IS NOT NULL
                  AND deleted_at IS NULL
                GROUP BY 1
                ORDER BY 1 ASC
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        // Build all 10 buckets even if count = 0
        Map<Integer, Long> bucketMap = new HashMap<>();
        for (Object[] r : rows) {
            int bucketNum = ((Number) r[0]).intValue();
            long count = ((Number) r[1]).longValue();
            bucketMap.put(bucketNum, count);
        }
        List<ConfidenceDistributionDto> result = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            double low = (i - 1) * 0.1;
            double high = i * 0.1;
            String label = String.format("%.1f\u2013%.1f", low, high);
            result.add(new ConfidenceDistributionDto(label, low, high, bucketMap.getOrDefault(i, 0L)));
        }
        return result;
    }

    public List<ProcessingVolumePoint> getProcessingVolume(Instant startDate, Instant endDate, String granularity) {
        String trunc = switch (granularity.toLowerCase()) {
            case "week" -> "week";
            case "month" -> "month";
            default -> "day";
        };
        String sql = """
                SELECT date_trunc(:trunc, uploaded_at) AS bucket, COUNT(*) AS count
                FROM classifications
                WHERE uploaded_at BETWEEN :start AND :end AND deleted_at IS NULL
                GROUP BY 1 ORDER BY 1 ASC
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("trunc", trunc);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows.stream()
                .map(r -> new ProcessingVolumePoint(r[0].toString(), ((Number) r[1]).longValue()))
                .toList();
    }

    public Page<RecentOverrideDto> getOverrides(Pageable pageable) {
        String countSql = "SELECT COUNT(*) FROM classifications WHERE reviewed_by IS NOT NULL AND deleted_at IS NULL";
        long total = ((Number) em.createNativeQuery(countSql).getSingleResult()).longValue();

        String sql = """
                SELECT c.id, c.plan_id, u.username AS reviewer,
                       c.taxonomy_category AS original_category,
                       c.taxonomy_code AS override_category,
                       c.override_reason,
                       c.reviewed_at
                FROM classifications c
                LEFT JOIN users u ON u.id = c.reviewed_by
                WHERE c.reviewed_by IS NOT NULL AND c.deleted_at IS NULL
                ORDER BY c.reviewed_at DESC
                LIMIT :limit OFFSET :offset
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("limit", pageable.getPageSize());
        query.setParameter("offset", pageable.getOffset());
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<RecentOverrideDto> dtos = rows.stream().map(r -> new RecentOverrideDto(
                (UUID) r[0], (String) r[1], (String) r[2],
                (String) r[3], (String) r[4], (String) r[5],
                r[6] != null ? ((java.sql.Timestamp) r[6]).toInstant() : null
        )).toList();
        return new PageImpl<>(dtos, pageable, total);
    }

    public ModelPerformanceDto getModelPerformance(Instant startDate, Instant endDate) {
        String sql = """
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'CLASSIFIED' AND reviewed_by IS NULL) AS true_positive,
                    COUNT(*) FILTER (WHERE status = 'NEEDS_REVIEW') AS needs_review
                FROM classifications
                WHERE uploaded_at BETWEEN :start AND :end AND deleted_at IS NULL
                """;
        var query = em.createNativeQuery(sql);
        query.setParameter("start", startDate);
        query.setParameter("end", endDate);
        Object[] row = (Object[]) query.getSingleResult();
        long totalEvaluated = ((Number) row[0]).longValue();
        long tp = ((Number) row[1]).longValue();
        long needsReview = ((Number) row[2]).longValue();
        if (totalEvaluated < 10) {
            return new ModelPerformanceDto(0.0, 0.0, 0.0, totalEvaluated);
        }
        double precision = totalEvaluated > 0 ? (double) tp / totalEvaluated : 0.0;
        double recall = (tp + needsReview) > 0 ? (double) tp / (tp + needsReview) : 0.0;
        double f1 = (precision + recall) > 0 ? 2.0 * precision * recall / (precision + recall) : 0.0;
        return new ModelPerformanceDto(precision, recall, f1, totalEvaluated);
    }
}
