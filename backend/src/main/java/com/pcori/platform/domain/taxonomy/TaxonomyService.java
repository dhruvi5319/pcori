package com.pcori.platform.domain.taxonomy;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.taxonomy.dto.TaxonomyCategoryDto;
import com.pcori.platform.domain.taxonomy.dto.TaxonomyTreeNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.pcori.platform.domain.taxonomy.dto.CreateTaxonomyRequest;
import com.pcori.platform.domain.taxonomy.dto.UpdateTaxonomyRequest;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TaxonomyService {

    private final TaxonomyRepository taxonomyRepository;

    // ── FR-3.1: CREATE ──────────────────────────────────────────────────────

    @PreAuthorize("hasRole('TAXONOMY_ADMIN')")
    public TaxonomyCategory create(CreateTaxonomyRequest req) {
        // Validate parent
        TaxonomyCategory parent = null;
        if (req.parentId() != null) {
            parent = taxonomyRepository.findById(req.parentId())
                .orElseThrow(() -> new DomainExceptions.InvalidParentException(
                    "Parent not found: " + req.parentId()));
            if (!Boolean.TRUE.equals(parent.getIsActive())) {
                throw new DomainExceptions.InvalidParentException("Parent category is inactive");
            }
            if (!req.level().equals(parent.getLevel() + 1)) {
                throw new DomainExceptions.InvalidLevelException(
                    "Level must be parent level + 1 (parent level=" + parent.getLevel() + ")");
            }
        } else {
            if (req.level() != 0) {
                throw new DomainExceptions.InvalidLevelException("Root level must be 0");
            }
        }

        // Validate code uniqueness within same parent
        boolean duplicate = parent != null
            ? taxonomyRepository.existsByCodeAndParentId(req.code(), parent.getId())
            : taxonomyRepository.existsByCodeAndParentIsNull(req.code());
        if (duplicate) {
            throw new DomainExceptions.CodeDuplicateException(
                "Code '" + req.code() + "' already exists under this parent");
        }

        TaxonomyCategory entity = new TaxonomyCategory();
        entity.setCode(req.code());
        entity.setName(req.name());
        entity.setDescription(req.description());
        entity.setParent(parent);
        entity.setLevel(req.level());
        entity.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
        entity.setIsActive(true);
        log.debug("Creating taxonomy category: code={}, level={}", req.code(), req.level());
        return taxonomyRepository.save(entity);
    }

    // ── FR-3.1: READ ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public TaxonomyCategory getById(UUID id) {
        return taxonomyRepository.findById(id)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Taxonomy category " + id + " not found"));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public TaxonomyCategory getByCode(String code) {
        return taxonomyRepository.findByCode(code)
            .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                "Taxonomy code '" + code + "' not found"));
    }

    // ── FR-3.1: UPDATE ──────────────────────────────────────────────────────

    @PreAuthorize("hasRole('TAXONOMY_ADMIN')")
    public TaxonomyCategory update(UUID id, UpdateTaxonomyRequest req) {
        TaxonomyCategory entity = getById(id);

        if (req.code() != null && !req.code().equals(entity.getCode())) {
            UUID parentId = entity.getParent() != null ? entity.getParent().getId() : null;
            boolean duplicate = parentId != null
                ? taxonomyRepository.existsByCodeAndParentId(req.code(), parentId)
                : taxonomyRepository.existsByCodeAndParentIsNull(req.code());
            if (duplicate) {
                throw new DomainExceptions.CodeDuplicateException(
                    "Code '" + req.code() + "' already exists under this parent");
            }
            entity.setCode(req.code());
        }
        if (req.name() != null) entity.setName(req.name());
        if (req.description() != null) entity.setDescription(req.description());
        if (req.displayOrder() != null) entity.setDisplayOrder(req.displayOrder());
        return taxonomyRepository.save(entity);
    }

    // ── FR-3.1: DELETE — deactivates, never hard-deletes ────────────────────

    @PreAuthorize("hasRole('TAXONOMY_ADMIN')")
    public TaxonomyCategory delete(UUID id) {
        return setActive(id, false);
    }

    // ── FR-3.2: TREE ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public List<TaxonomyTreeNode> getFullTree() {
        List<TaxonomyCategory> roots = taxonomyRepository.findByParentIsNullOrderByDisplayOrderAsc();
        return roots.stream()
            .map(this::toTreeNode)
            .collect(Collectors.toList());
    }

    private TaxonomyTreeNode toTreeNode(TaxonomyCategory cat) {
        List<TaxonomyTreeNode> childNodes = cat.getChildren().stream()
            .map(this::toTreeNode)
            .collect(Collectors.toList());
        return new TaxonomyTreeNode(toDto(cat), childNodes);
    }

    // ── FR-3.2: CHILDREN ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public List<TaxonomyCategory> getChildren(UUID parentId) {
        return taxonomyRepository.findByParentIdOrderByDisplayOrderAsc(parentId);
    }

    // ── FR-3.3: ACTIVATE / DEACTIVATE with cascade ──────────────────────────

    @PreAuthorize("hasRole('TAXONOMY_ADMIN')")
    public TaxonomyCategory setActive(UUID id, boolean active) {
        TaxonomyCategory entity = getById(id);

        if (active) {
            // Cannot activate if parent is inactive
            if (entity.getParent() != null
                    && !Boolean.TRUE.equals(entity.getParent().getIsActive())) {
                throw new DomainExceptions.InactiveParentException(
                    "Cannot activate — parent category is inactive. Activate the parent first.");
            }
        } else {
            // Cascade deactivation to all descendants in a single transaction
            List<TaxonomyCategory> descendants = taxonomyRepository.findAllDescendants(id);
            descendants.forEach(d -> d.setIsActive(false));
            if (!descendants.isEmpty()) {
                taxonomyRepository.saveAll(descendants);
                log.debug("Cascaded deactivation to {} descendants of {}", descendants.size(), id);
            }
        }

        entity.setIsActive(active);
        return taxonomyRepository.save(entity);
    }

    // ── FR-3.4: SEARCH ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public List<TaxonomyCategory> search(String term, boolean activeOnly) {
        if (term == null || term.isBlank()) return List.of();
        return activeOnly
            ? taxonomyRepository.searchActiveByText(term)
            : taxonomyRepository.searchByText(term);
    }

    // ── FR-3.5: ACTIVE LIST (for override dropdowns and keyword classifier) ──

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('REVIEWER')")
    public List<TaxonomyCategory> getActiveCategories() {
        return taxonomyRepository.findByIsActiveTrueOrderByLevelAscDisplayOrderAsc();
    }

    // ── DTO mapping helper ───────────────────────────────────────────────────

    public TaxonomyCategoryDto toDto(TaxonomyCategory c) {
        UUID parentId = c.getParent() != null ? c.getParent().getId() : null;
        String parentCode = c.getParent() != null ? c.getParent().getCode() : null;
        return new TaxonomyCategoryDto(
            c.getId(),
            c.getCode(),
            c.getName(),
            c.getDescription(),
            parentId,
            parentCode,
            Boolean.TRUE.equals(c.getIsActive()),
            c.getLevel() != null ? c.getLevel() : 0,
            c.getDisplayOrder() != null ? c.getDisplayOrder() : 0,
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
