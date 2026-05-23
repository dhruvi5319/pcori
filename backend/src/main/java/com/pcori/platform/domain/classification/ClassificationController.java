package com.pcori.platform.domain.classification;

import com.pcori.platform.common.dto.PagedResponse;
import com.pcori.platform.domain.classification.dto.*;
import com.pcori.platform.domain.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for classification endpoints (FR-2.1–FR-2.8).
 * All 11 endpoints per TechArch API catalog §Classifications.
 */
@RestController
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
public class ClassificationController {

    private final ClassificationService classificationService;
    private final ClassificationRepository classificationRepository;

    // POST /api/classifications/upload — FR-2.1
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.accepted()
                .body(classificationService.uploadAndClassify(file, title, notes, userId));
    }

    // GET /api/classifications — FR-2.8 (filter + paginate)
    @GetMapping
    public ResponseEntity<PagedResponse<ClassificationResponse>> list(
            @RequestParam(required = false) ClassificationStatus status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String pcc,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "uploadedAt,desc") String sort) {
        ClassificationFilters filters = new ClassificationFilters(
                status,
                parseDate(startDate),
                parseDate(endDate),
                pcc,
                q
        );
        Pageable pageable = buildPageable(page, size, sort);
        Page<Classification> result = classificationService.list(filters, pageable);
        return ResponseEntity.ok(PagedResponse.from(result, ClassificationResponse::from));
    }

    // GET /api/classifications/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ClassificationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ClassificationResponse.from(classificationService.getById(id)));
    }

    // PUT /api/classifications/{id}/override — FR-2.6
    @PutMapping("/{id}/override")
    public ResponseEntity<ClassificationResponse> override(
            @PathVariable UUID id,
            @Valid @RequestBody ManualOverrideRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID reviewedBy = resolveUserId(userDetails);
        return ResponseEntity.ok(
                ClassificationResponse.from(classificationService.applyOverride(id, req, reviewedBy)));
    }

    // POST /api/classifications/{id}/retry — FR-2.7
    @PostMapping("/{id}/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<ClassificationResponse> retry(@PathVariable UUID id) {
        return ResponseEntity.accepted()
                .body(ClassificationResponse.from(classificationService.retry(id)));
    }

    // GET /api/classifications/statistics — MANAGER+
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ClassificationStats> getStatistics() {
        return ResponseEntity.ok(classificationRepository.getStatistics());
    }

    // GET /api/classifications/recent
    @GetMapping("/recent")
    public ResponseEntity<List<ClassificationResponse>> getRecent(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(
                classificationRepository.findRecentByLimit(Math.min(limit, 25))
                        .stream()
                        .map(ClassificationResponse::from)
                        .collect(Collectors.toList()));
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolves the authenticated user's UUID.
     * User extends UserDetails and its id is a UUID; username stores the UUID string.
     */
    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails instanceof User user) {
            return user.getId();
        }
        // Fallback: parse username as UUID (used in tests/stubs where User is not available)
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Cannot resolve user ID from principal: " + userDetails.getUsername());
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private Pageable buildPageable(int page, int size, String sortParam) {
        int clampedSize = Math.min(Math.max(size, 1), 100);
        int clampedPage = Math.max(page, 0);
        try {
            String[] parts = sortParam.split(",");
            String field = parts[0].trim();
            Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            return PageRequest.of(clampedPage, clampedSize, Sort.by(direction, field));
        } catch (Exception e) {
            return PageRequest.of(clampedPage, clampedSize, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        }
    }
}
