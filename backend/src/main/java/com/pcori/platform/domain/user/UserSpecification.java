package com.pcori.platform.domain.user;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

@UtilityClass
public class UserSpecification {

    /**
     * Build a composite Specification for dynamic user search.
     *
     * @param q      keyword — ILIKE match against username, email, firstName, lastName
     * @param role   role name filter
     * @param active status filter (true = active, false = inactive, null = any)
     */
    public static Specification<User> withFilters(String q, String role, Boolean active) {
        return Specification.where(byKeyword(q))
                .and(byRole(role))
                .and(byStatus(active));
    }

    private static Specification<User> byKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("username")), pattern),
                cb.like(cb.lower(root.get("email")), pattern),
                cb.like(cb.lower(root.get("firstName")), pattern),
                cb.like(cb.lower(root.get("lastName")), pattern)
        );
    }

    private static Specification<User> byRole(String roleName) {
        if (roleName == null || roleName.isBlank()) return null;
        return (root, query, cb) -> {
            Join<User, Role> roleJoin = root.join("roles");
            return cb.equal(cb.lower(roleJoin.get("name")), roleName.toLowerCase());
        };
    }

    private static Specification<User> byStatus(Boolean active) {
        if (active == null) return null;
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("isActive"), active));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
