package com.pcori.platform.domain.classification;

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

@RestController
@RequestMapping("/api/classifications")
@RequiredArgsConstructor
public class ClassificationController {

    private final ClassificationService classificationService;

    /**
     * POST /api/classifications/upload — upload PDF; returns 202 with planId
     */
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

    /**
     * GET /api/classifications — paginated list with filters
     */
    @GetMapping
    public ResponseEntity<PagedResponse<ClassificationResponse>> list(
            @RequestParam(required = false) ClassificationStatus status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String pcc,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "uploadedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        ClassificationFilters filters = new ClassificationFilters(
            status,
            parseDate(startDate),
            parseDate(endDate),
            pcc,
            q
        );
        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        Page<Classification> result = classificationService.list(filters, pageable);

        return ResponseEntity.ok(new PagedResponse<>(
            result.getContent().stream().map(this::toResponse).collect(Collectors.toList()),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.isLast()
        ));
    }

    /**
     * GET /api/classifications/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClassificationResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(toResponse(classificationService.getById(id)));
    }

    /**
     * PUT /api/classifications/{id}/override — manual override
     */
    @PutMapping("/{id}/override")
    public ResponseEntity<ClassificationResponse> override(
            @PathVariable UUID id,
            @Valid @RequestBody ManualOverrideRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails);
        return ResponseEntity.ok(toResponse(classificationService.applyOverride(id, req, userId)));
    }

    /**
     * POST /api/classifications/{id}/retry — retry FAILED classification
     */
    @PostMapping("/{id}/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<ClassificationResponse> retry(@PathVariable UUID id) {
        return ResponseEntity.accepted().body(toResponse(classificationService.retry(id)));
    }

    /**
     * GET /api/classifications/statistics — PROGRAM_MANAGER / ADMIN only
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('PROGRAM_MANAGER', 'ADMIN')")
    public ResponseEntity<ClassificationStats> getStatistics() {
        return ResponseEntity.ok(classificationService.getStatistics());
    }

    /**
     * GET /api/classifications/recent — last 10 classifications
     */
    @GetMapping("/recent")
    public ResponseEntity<List<ClassificationResponse>> getRecent(
            @RequestParam(defaultValue = "10") int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(limit, 25), Sort.by("uploadedAt").descending());
        Page<Classification> result = classificationService.list(
            new ClassificationFilters(null, null, null, null, null), pageable);
        return ResponseEntity.ok(result.getContent().stream()
            .map(this::toResponse)
            .collect(Collectors.toList()));
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    private ClassificationResponse toResponse(Classification c) {
        return new ClassificationResponse(
            c.getId(), c.getPlanId(), c.getTitle(), c.getStatus(),
            c.getPcc(), c.getTaxonomyCategory(), c.getTaxonomyCode(), c.getTaxonomySubcode(),
            c.getPrimaryCondition(), c.getProjectSummary(), c.getTextPreview(), c.getExtractionWarning(),
            c.getConfidenceScore(), c.getModelVersion(), c.getProcessingTimeMs(),
            c.getFileName(), c.getFileSize(), c.getNotes(),
            c.getUploadedBy(), c.getUploadedAt(), c.getClassifiedAt(),
            c.getReviewedBy(), c.getReviewedAt(), c.getOverrideReason(), c.getErrorMessage(),
            c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private UUID resolveUserId(UserDetails userDetails) {
        if (userDetails instanceof User user) {
            return user.getId();
        }
        // Fallback: should not happen in normal operation
        throw new IllegalStateException("Cannot resolve user ID from principal");
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }
}
