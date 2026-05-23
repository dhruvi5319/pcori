package com.pcori.platform.domain.classification;

import com.pcori.platform.domain.classification.dto.ClassificationFilters;
import jakarta.persistence.criteria.Predicate;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Specification builder for Classification filters (FR-2.8).
 */
@UtilityClass
public class ClassificationSpecification {

    public static Specification<Classification> withFilters(ClassificationFilters f) {
        return Specification.where(byStatus(f.status()))
                .and(byDateRange(f.startDate(), f.endDate()))
                .and(byPcc(f.pcc()))
                .and(byKeyword(f.q()));
    }

    private static Specification<Classification> byStatus(ClassificationStatus status) {
        return status == null ? null : (r, q, cb) -> cb.equal(r.get("status"), status);
    }

    private static Specification<Classification> byDateRange(LocalDate start, LocalDate end) {
        if (start == null && end == null) return null;
        return (r, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        r.get("uploadedAt"), start.atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        r.get("uploadedAt"), end.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Specification<Classification> byPcc(String pcc) {
        return pcc == null || pcc.isBlank() ? null : (r, q, cb) -> cb.equal(r.get("pcc"), pcc);
    }

    private static Specification<Classification> byKeyword(String q) {
        if (q == null || q.isBlank()) return null;
        String pattern = "%" + q.toLowerCase() + "%";
        return (r, query, cb) -> cb.or(
                cb.like(cb.lower(r.get("planId")), pattern),
                cb.like(cb.lower(r.get("title")), pattern)
        );
    }
}
