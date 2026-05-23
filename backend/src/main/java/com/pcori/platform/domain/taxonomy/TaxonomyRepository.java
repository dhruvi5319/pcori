package com.pcori.platform.domain.taxonomy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxonomyRepository extends JpaRepository<TaxonomyCategory, UUID> {

    // Tree: root nodes (parent IS NULL, active only)
    List<TaxonomyCategory> findByParentIsNullOrderByDisplayOrderAsc();

    // Children of a node
    List<TaxonomyCategory> findByParentIdOrderByDisplayOrderAsc(UUID parentId);

    // All active categories (for override dropdowns and keyword classifier)
    List<TaxonomyCategory> findByIsActiveTrueOrderByLevelAscDisplayOrderAsc();

    // Lookup by code
    Optional<TaxonomyCategory> findByCode(String code);

    // Direct children query (explicit JPQL)
    @Query("SELECT tc FROM TaxonomyCategory tc WHERE tc.parent.id = :parentId")
    List<TaxonomyCategory> findDirectChildrenOf(@Param("parentId") UUID parentId);

    // Full-text search via GIN index (native query)
    @Query(value = "SELECT * FROM taxonomy_categories WHERE deleted_at IS NULL AND search_vector @@ plainto_tsquery('english', :term) ORDER BY ts_rank(search_vector, plainto_tsquery('english', :term)) DESC",
           nativeQuery = true)
    List<TaxonomyCategory> searchByText(@Param("term") String term);

    // Active-only search
    @Query(value = "SELECT * FROM taxonomy_categories WHERE deleted_at IS NULL AND is_active = TRUE AND search_vector @@ plainto_tsquery('english', :term) ORDER BY ts_rank(search_vector, plainto_tsquery('english', :term)) DESC",
           nativeQuery = true)
    List<TaxonomyCategory> searchActiveByText(@Param("term") String term);

    // Check if code exists within same parent (for uniqueness validation)
    boolean existsByCodeAndParentId(String code, UUID parentId);

    // Root-level uniqueness
    boolean existsByCodeAndParentIsNull(String code);

    // All descendants of a node (for cascade deactivation — recursive CTE)
    @Query(value = """
        WITH RECURSIVE descendants AS (
            SELECT id FROM taxonomy_categories WHERE parent_id = :rootId AND deleted_at IS NULL
            UNION ALL
            SELECT tc.id FROM taxonomy_categories tc
            INNER JOIN descendants d ON tc.parent_id = d.id
            WHERE tc.deleted_at IS NULL
        )
        SELECT tc.* FROM taxonomy_categories tc
        INNER JOIN descendants d ON tc.id = d.id
        """, nativeQuery = true)
    List<TaxonomyCategory> findAllDescendants(@Param("rootId") UUID rootId);
}
