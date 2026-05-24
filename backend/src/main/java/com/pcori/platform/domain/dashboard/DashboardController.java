package com.pcori.platform.domain.dashboard;

import com.pcori.platform.domain.dashboard.dto.DashboardConfigurationDto;
import com.pcori.platform.domain.dashboard.dto.DashboardMetricsDto;
import com.pcori.platform.domain.dashboard.dto.SaveConfigurationRequest;
import com.pcori.platform.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * REST controller for dashboard endpoints (FR-4.1, FR-4.2, FR-4.5, FR-4.6).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET    /api/dashboard/metrics</li>
 *   <li>GET    /api/dashboard/metrics/range?startDate=&endDate=</li>
 *   <li>GET    /api/dashboard/configuration</li>
 *   <li>POST   /api/dashboard/configuration  (upsert)</li>
 *   <li>PUT    /api/dashboard/configuration  (upsert)</li>
 *   <li>DELETE /api/dashboard/configuration  (reset / soft-delete)</li>
 *   <li>GET    /api/dashboard/configuration/{id}</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private final DashboardService dashboardService;

    // ----------------------------------------------------------------
    // Metrics
    // ----------------------------------------------------------------

    /**
     * GET /api/dashboard/metrics
     * Returns aggregate KPI counts and avg confidence for all non-deleted classifications.
     */
    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDto> getMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    /**
     * GET /api/dashboard/metrics/range?startDate=&endDate=
     * Returns KPI metrics scoped to the given date range (FR-4.6).
     * Accepts ISO-8601 instant strings ("2024-01-01T00:00:00Z") or plain dates ("2024-01-01").
     * Defaults: startDate = 30 days ago, endDate = now.
     */
    @GetMapping("/metrics/range")
    public ResponseEntity<DashboardMetricsDto> getMetricsRange(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Instant start = parseInstant(startDate, Instant.now().minus(30, ChronoUnit.DAYS));
        Instant end   = parseInstant(endDate, Instant.now());
        return ResponseEntity.ok(dashboardService.getMetricsForRange(start, end));
    }

    // ----------------------------------------------------------------
    // Configuration (FR-4.5)
    // ----------------------------------------------------------------

    /**
     * GET /api/dashboard/configuration
     * Returns the authenticated user's saved widget layout, or 204 No Content if none saved.
     */
    @GetMapping("/configuration")
    public ResponseEntity<DashboardConfigurationDto> getConfiguration(Authentication auth) {
        UUID userId = getUserId(auth);
        return dashboardService.getConfiguration(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * POST /api/dashboard/configuration
     * Creates or updates (upsert) the user's widget layout configuration.
     */
    @PostMapping("/configuration")
    public ResponseEntity<DashboardConfigurationDto> createConfiguration(
            @RequestBody SaveConfigurationRequest req, Authentication auth) {
        return ResponseEntity.ok(dashboardService.saveConfiguration(getUserId(auth), req));
    }

    /**
     * PUT /api/dashboard/configuration
     * Updates (upsert) the user's widget layout configuration.
     */
    @PutMapping("/configuration")
    public ResponseEntity<DashboardConfigurationDto> updateConfiguration(
            @RequestBody SaveConfigurationRequest req, Authentication auth) {
        return ResponseEntity.ok(dashboardService.saveConfiguration(getUserId(auth), req));
    }

    /**
     * DELETE /api/dashboard/configuration
     * Soft-deletes the user's layout configuration, resetting it to defaults on next GET.
     */
    @DeleteMapping("/configuration")
    public ResponseEntity<Void> deleteConfiguration(Authentication auth) {
        dashboardService.deleteConfiguration(getUserId(auth));
        return ResponseEntity.ok().<Void>build();
    }

    /**
     * GET /api/dashboard/configuration/{id}
     * Returns the configuration only if it belongs to the authenticated user.
     */
    @GetMapping("/configuration/{id}")
    public ResponseEntity<DashboardConfigurationDto> getConfigurationById(
            @PathVariable UUID id, Authentication auth) {
        return dashboardService.getConfiguration(getUserId(auth))
                .filter(c -> c.id().equals(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    private UUID getUserId(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return user.getId();
    }

    /**
     * Parses an ISO-8601 instant string or plain date string.
     * Falls back to {@code defaultValue} on null/blank/parse error.
     */
    private Instant parseInstant(String value, Instant defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            if (value.contains("T")) {
                return Instant.parse(value);
            }
            return LocalDate.parse(value).atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
