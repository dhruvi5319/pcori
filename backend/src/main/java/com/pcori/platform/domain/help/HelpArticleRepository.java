package com.pcori.platform.domain.help;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HelpArticleRepository extends JpaRepository<HelpArticle, UUID> {

    Optional<HelpArticle> findBySlug(String slug);

    List<HelpArticle> findByCategoryOrderByPublishedAtDesc(String category);

    List<HelpArticle> findAllByOrderByPublishedAtDesc();

    /**
     * Full-text search using the GIN index on search_vector.
     * q is a search term — converted to tsquery with plainto_tsquery for safety.
     * Returns articles ordered by ts_rank descending.
     */
    @Query(value = """
            SELECT * FROM help_articles
            WHERE deleted_at IS NULL
              AND search_vector @@ plainto_tsquery('english', :q)
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', :q)) DESC
            """, nativeQuery = true)
    List<HelpArticle> searchFullText(@Param("q") String q);
}
