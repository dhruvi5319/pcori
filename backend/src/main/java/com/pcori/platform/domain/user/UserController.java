package com.pcori.platform.domain.user;

import com.pcori.platform.common.dto.PagedResponse;
import com.pcori.platform.domain.user.dto.CreateUserRequest;
import com.pcori.platform.domain.user.dto.UpdateUserRequest;
import com.pcori.platform.domain.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users — paginated list of all users (ADMIN only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<UserResponse>> listAll(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.listAll(pageable));
    }

    /**
     * GET /api/users/active — list active users (no role restriction; used by other domains)
     */
    @GetMapping("/active")
    public ResponseEntity<List<UserResponse>> listActive() {
        return ResponseEntity.ok(userService.listActive());
    }

    /**
     * GET /api/users/search?q=&role=&status=&page=&size= — search with filters (ADMIN only)
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<UserResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.searchUsers(q, role, active, pageable));
    }

    /**
     * GET /api/users/{id} — get user by ID (ADMIN only)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    /**
     * POST /api/users — create a new user (ADMIN only); returns 201
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        UserResponse created = userService.createUser(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/users/{id} — update user name/phone/roles (ADMIN only)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(id, req));
    }

    /**
     * PATCH /api/users/{id}/status — toggle active/inactive (ADMIN only)
     * Body: {"active": boolean}
     * If active=false, deactivation guard prevents admin from deactivating own account.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleStatus(
            @PathVariable UUID id,
            @RequestBody StatusRequest req,
            @AuthenticationPrincipal User principal) {
        UUID currentUserId = principal.getId();
        UserResponse response = req.active()
                ? userService.reactivateUser(id)
                : userService.deactivateUser(id, currentUserId);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/users/{id} — soft-delete user (ADMIN only); returns 204
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ── Inner record for PATCH /status body ──────────────────────────────────

    public record StatusRequest(boolean active) {}
}
