package com.pcori.platform.domain.report;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.report.dto.FilterConfigRequest;
import com.pcori.platform.domain.report.dto.FilterConfigResponse;
import com.pcori.platform.domain.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for filter configuration CRUD.
 *
 * All endpoints are user-scoped: users can only see/modify their own filter configurations.
 *
 * Endpoints:
 * <pre>
 * GET    /api/filters        → 200 List&lt;FilterConfigResponse&gt;
 * POST   /api/filters        → 201 FilterConfigResponse
 * GET    /api/filters/{id}   → 200 FilterConfigResponse
 * PUT    /api/filters/{id}   → 200 FilterConfigResponse
 * DELETE /api/filters/{id}   → 204
 * </pre>
 */
@RestController
@RequestMapping("/api/filters")
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FilterController {

    private final FilterConfigurationRepository filterConfigurationRepository;

    /**
     * GET /api/filters
     * List all filter configurations for the current user.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<FilterConfigResponse>> listFilters(
            @AuthenticationPrincipal User principal) {
        List<FilterConfigResponse> filters = filterConfigurationRepository
            .findByUserIdAndDeletedAtIsNull(principal.getId())
            .stream()
            .map(this::toResponse)
            .toList();
        return ResponseEntity.ok(filters);
    }

    /**
     * POST /api/filters
     * Create a new filter configuration for the current user.
     */
    @PostMapping
    public ResponseEntity<FilterConfigResponse> createFilter(
            @Valid @RequestBody FilterConfigRequest req,
            @AuthenticationPrincipal User principal) {
        if (filterConfigurationRepository.existsByUserIdAndName(principal.getId(), req.name())) {
            throw new DomainExceptions.DuplicateResourceException(
                "A filter named '" + req.name() + "' already exists");
        }

        FilterConfiguration filter = new FilterConfiguration();
        filter.setUserId(principal.getId());
        filter.setName(req.name());
        filter.setCriteria(req.criteriaJson());
        FilterConfiguration saved = filterConfigurationRepository.save(filter);

        log.info("Filter configuration {} created for user {}", saved.getId(), principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /**
     * GET /api/filters/{id}
     * Get a single filter configuration (must belong to current user).
     */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<FilterConfigResponse> getFilter(
            @PathVariable UUID id,
            @AuthenticationPrincipal User principal) {
        FilterConfiguration filter = findByIdAndUser(id, principal.getId());
        return ResponseEntity.ok(toResponse(filter));
    }

    /**
     * PUT /api/filters/{id}
     * Update a filter configuration (must belong to current user).
     */
    @PutMapping("/{id}")
    public ResponseEntity<FilterConfigResponse> updateFilter(
            @PathVariable UUID id,
            @Valid @RequestBody FilterConfigRequest req,
            @AuthenticationPrincipal User principal) {
        FilterConfiguration filter = findByIdAndUser(id, principal.getId());

        // Name uniqueness: allow same name for self, check uniqueness for rename
        if (!filter.getName().equals(req.name())
                && filterConfigurationRepository.existsByUserIdAndName(principal.getId(), req.name())) {
            throw new DomainExceptions.DuplicateResourceException(
                "A filter named '" + req.name() + "' already exists");
        }

        filter.setName(req.name());
        filter.setCriteria(req.criteriaJson());
        FilterConfiguration updated = filterConfigurationRepository.save(filter);

        return ResponseEntity.ok(toResponse(updated));
    }

    /**
     * DELETE /api/filters/{id}
     * Soft-delete a filter configuration (must belong to current user).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFilter(
            @PathVariable UUID id,
            @AuthenticationPrincipal User principal) {
        FilterConfiguration filter = findByIdAndUser(id, principal.getId());
        filter.setDeletedAt(Instant.now());
        filterConfigurationRepository.save(filter);

        log.info("Filter configuration {} soft-deleted by user {}", id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private FilterConfiguration findByIdAndUser(UUID id, UUID userId) {
        FilterConfiguration filter = filterConfigurationRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Filter configuration not found: " + id));
        // Ownership check — return 404 rather than 403 to avoid leaking existence
        if (!userId.equals(filter.getUserId())) {
            throw new DomainExceptions.ResourceNotFoundException(
                "Filter configuration not found: " + id);
        }
        return filter;
    }

    private FilterConfigResponse toResponse(FilterConfiguration f) {
        return new FilterConfigResponse(
            f.getId(),
            f.getName(),
            f.getCriteria(),
            f.getCreatedAt(),
            f.getUpdatedAt()
        );
    }
}
