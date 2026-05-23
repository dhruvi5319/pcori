package com.pcori.platform.domain.taxonomy;

import com.pcori.platform.domain.taxonomy.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/taxonomy")
@RequiredArgsConstructor
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    /** GET /api/taxonomy/tree — full nested tree */
    @GetMapping("/tree")
    public ResponseEntity<List<TaxonomyTreeNode>> getTree() {
        return ResponseEntity.ok(taxonomyService.getFullTree());
    }

    /** GET /api/taxonomy/active — flat list of all active categories */
    @GetMapping("/active")
    public ResponseEntity<List<TaxonomyCategoryDto>> getActive() {
        return ResponseEntity.ok(taxonomyService.getActiveCategories().stream()
            .map(taxonomyService::toDto)
            .collect(Collectors.toList()));
    }

    /** GET /api/taxonomy/search?q={term}&activeOnly={true|false} */
    @GetMapping("/search")
    public ResponseEntity<List<TaxonomyCategoryDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(taxonomyService.search(q, activeOnly).stream()
            .map(taxonomyService::toDto)
            .collect(Collectors.toList()));
    }

    /** GET /api/taxonomy/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.getById(id)));
    }

    /** GET /api/taxonomy/code/{code} */
    @GetMapping("/code/{code}")
    public ResponseEntity<TaxonomyCategoryDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.getByCode(code)));
    }

    /** GET /api/taxonomy/{id}/children */
    @GetMapping("/{id}/children")
    public ResponseEntity<List<TaxonomyCategoryDto>> getChildren(@PathVariable UUID id) {
        return ResponseEntity.ok(taxonomyService.getChildren(id).stream()
            .map(taxonomyService::toDto)
            .collect(Collectors.toList()));
    }

    /** GET /api/taxonomy — all active categories (alias for /active) */
    @GetMapping
    public ResponseEntity<List<TaxonomyCategoryDto>> listAll() {
        return ResponseEntity.ok(taxonomyService.getActiveCategories().stream()
            .map(taxonomyService::toDto)
            .collect(Collectors.toList()));
    }

    /** POST /api/taxonomy — create category (TAXONOMY_ADMIN / ADMIN) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TaxonomyCategoryDto> create(@Valid @RequestBody CreateTaxonomyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taxonomyService.toDto(taxonomyService.create(req)));
    }

    /** PUT /api/taxonomy/{id} — update category (TAXONOMY_ADMIN / ADMIN) */
    @PutMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaxonomyRequest req) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.update(id, req)));
    }

    /** DELETE /api/taxonomy/{id} — deactivate (never hard-delete) */
    @DeleteMapping("/{id}")
    public ResponseEntity<TaxonomyCategoryDto> delete(@PathVariable UUID id) {
        return ResponseEntity.ok(taxonomyService.toDto(taxonomyService.delete(id)));
    }

    /** PATCH /api/taxonomy/{id}/status — activate or deactivate with cascade */
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
