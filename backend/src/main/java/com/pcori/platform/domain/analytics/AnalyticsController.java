package com.pcori.platform.domain.analytics;

import com.pcori.platform.domain.analytics.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    private static final Instant DEFAULT_START = Instant.now().minus(30, ChronoUnit.DAYS);
    private static final String DEFAULT_GRANULARITY = "day";

    @GetMapping("/accuracy-trend")
    public ResponseEntity<List<AccuracyTrendPoint>> accuracyTrend(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "day") String granularity) {
        return ResponseEntity.ok(analyticsService.getAccuracyTrend(
                parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS)),
                parseInstant(endDate, Instant.now()),
                granularity));
    }

    @GetMapping("/category-accuracy")
    public ResponseEntity<List<CategoryAccuracyDto>> categoryAccuracy(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(analyticsService.getCategoryAccuracy(
                parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS)),
                parseInstant(endDate, Instant.now())));
    }

    @GetMapping("/confidence-distribution")
    public ResponseEntity<List<ConfidenceDistributionDto>> confidenceDistribution(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(analyticsService.getConfidenceDistribution(
                parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS)),
                parseInstant(endDate, Instant.now())));
    }

    @GetMapping("/processing-volume")
    public ResponseEntity<List<ProcessingVolumePoint>> processingVolume(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "day") String granularity) {
        return ResponseEntity.ok(analyticsService.getProcessingVolume(
                parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS)),
                parseInstant(endDate, Instant.now()),
                granularity));
    }

    @GetMapping("/overrides")
    public ResponseEntity<Page<RecentOverrideDto>> overrides(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(analyticsService.getOverrides(pageable));
    }

    @GetMapping("/model-performance")
    public ResponseEntity<ModelPerformanceDto> modelPerformance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(analyticsService.getModelPerformance(
                parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS)),
                parseInstant(endDate, Instant.now())));
    }

    private Instant parseInstant(String value, Instant defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            // Accept both ISO instant (2026-01-01T00:00:00Z) and date-only (2026-01-01)
            if (value.contains("T")) return Instant.parse(value);
            return LocalDate.parse(value).atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
