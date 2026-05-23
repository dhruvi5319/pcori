package com.pcori.platform.domain.classification;

import com.pcori.platform.domain.classification.dto.ClassificationFilters;
import jakarta.persistence.criteria.Predicate;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@UtilityClass
public class ClassificationSpecification {

    public static Specification<Classification> withFilters(ClassificationFilters f) {
        return Specification.where(byStatus(f.status()))
            .and(byDateRange(f))
            .and(byPcc(f.pcc()))
            .and(byKeyword(f.q()));
    }

    private static Specification<Classification> byStatus(ClassificationStatus status) {
        return status == null ? null : (r, q, cb) -> cb.equal(r.get("status"), status);
    }

    private static Specification<Classification> byDateRange(ClassificationFilters f) {
        if (f.startDate() == null && f.endDate() == null) return null;
        return (r, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (f.startDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                    r.get("uploadedAt"),
                    f.startDate().atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            if (f.endDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                    r.get("uploadedAt"),
                    f.endDate().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Specification<Classification> byPcc(String pcc) {
        return pcc == null || pcc.isBlank() ? null : (r, q, cb) -> cb.equal(r.get("pcc"), pcc);
    }

    private static Specification<Classification> byKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (r, query, cb) -> cb.or(
            cb.like(cb.lower(r.get("planId")), pattern),
            cb.like(cb.lower(r.get("title")), pattern)
        );
    }
}
