package com.pcori.platform.domain.taxonomy;

import com.pcori.platform.domain.taxonomy.dto.CreateTaxonomyRequest;
import com.pcori.platform.domain.taxonomy.dto.TaxonomyCategoryDto;
import com.pcori.platform.domain.taxonomy.dto.TaxonomyTreeNode;
import com.pcori.platform.domain.taxonomy.dto.UpdateTaxonomyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for taxonomy CRUD — 11 endpoints per TechArch API catalog §Taxonomy.
 *
 * All endpoints are protected; role-based authorization enforced at the service layer
 * via @PreAuthorize (requires REVIEWER for reads, TAXONOMY_ADMIN for writes).
 */
@RestController
@RequestMapping("/api/taxonomy")
@RequiredArgsConstructor
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    // ── GET /api/taxonomy/tree ───────────────────────────────────────────────
    @GetMapping("/tree")
    public ResponseEntity<List<TaxonomyTreeNode>> getTree() {
        return ResponseEntity.ok(taxonomyService.getFullTree());
    }

    // ── GET /api/taxonomy/active ─────────────────────────────────────────────
    @GetMapping("/active")
    public ResponseEntity<List<TaxonomyCategoryDto>> getActive() {
        return ResponseEntity.ok(
            taxonomyService.getActiveCategories().stream()
                .map(taxonomyService::toDto)
                .collect(Collectors.toList())
        );
    }

    // ── GET /api/taxonomy/search?q={term}&activeOnly={bool} ─────────────────
    @GetMapping("/search")
    public ResponseEntity<List<TaxonomyCategoryDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(
            taxonomyService.search(q, activeOnly).stream()
                .map(taxonomyService::toDto)
                .collect(Collectors.toList())
        );
    }

    // ── GET /api/taxonomy/{id} ───────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.getById(id)));
    }

    // ── GET /api/taxonomy/code/{code} ────────────────────────────────────────
    @GetMapping("/code/{code}")
    public ResponseEntity<TaxonomyCategoryDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.getByCode(code)));
    }

    // ── GET /api/taxonomy/{id}/children ─────────────────────────────────────
    @GetMapping("/{id}/children")
    public ResponseEntity<List<TaxonomyCategoryDto>> getChildren(@PathVariable UUID id) {
        return ResponseEntity.ok(
            taxonomyService.getChildren(id).stream()
                .map(taxonomyService::toDto)
                .collect(Collectors.toList())
        );
    }

    // ── GET /api/taxonomy (list all active — alias for /active) ─────────────
    @GetMapping
    public ResponseEntity<List<TaxonomyCategoryDto>> listAll() {
        return ResponseEntity.ok(
            taxonomyService.getActiveCategories().stream()
                .map(taxonomyService::toDto)
                .collect(Collectors.toList())
        );
    }

    // ── POST /api/taxonomy ───────────────────────────────────────────────────
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TaxonomyCategoryDto> create(@Valid @RequestBody CreateTaxonomyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taxonomyService.toDto(taxonomyService.create(req)));
    }

    // ── PUT /api/taxonomy/{id} ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaxonomyRequest req) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.update(id, req)));
    }

    // ── DELETE /api/taxonomy/{id} (soft-delete = deactivate) ────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.delete(id)));
    }

    // ── PATCH /api/taxonomy/{id}/status ─────────────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaxonomyCategoryDto> setStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body) {
        Boolean isActive = body.get("isActive");
        if (isActive == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.setActive(id, isActive)));
    }
}
