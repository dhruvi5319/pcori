package com.pcori.platform.domain.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Minimal admin controller — serves as RBAC proof-point for Phase 1 SC-5 and
 * scaffold for Phase 2 admin features (user management, pipeline control).
 *
 * All endpoints require ADMIN role. A REVIEWER-role JWT will receive 403
 * via GlobalExceptionHandler.handleAccessDenied().
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    /**
     * Health/reachability check for admin APIs.
     * Returns 200 for ADMIN-role JWTs; 403 for all other roles.
     */
    @GetMapping("/ping")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "timestamp", Instant.now().toString()
        ));
    }
}
