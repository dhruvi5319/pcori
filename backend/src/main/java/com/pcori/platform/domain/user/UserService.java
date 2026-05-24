package com.pcori.platform.domain.user;

import com.pcori.platform.common.dto.PagedResponse;
import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.user.dto.CreateUserRequest;
import com.pcori.platform.domain.user.dto.UpdateUserRequest;
import com.pcori.platform.domain.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * FR-7.1: Create a new user with hashed password and assigned roles.
     */
    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new DomainExceptions.ConflictException(
                    "Username '" + req.username() + "' is already taken");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new DomainExceptions.ConflictException(
                    "Email '" + req.email() + "' is already registered");
        }

        Set<Role> resolvedRoles = resolveRoles(req.roles());

        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .firstName(req.firstName())
                .lastName(req.lastName())
                .phoneNumber(req.phoneNumber())
                .roles(resolvedRoles)
                .isActive(true)
                .isEmailVerified(false)
                .build();

        User saved = userRepository.save(user);
        log.info("Created user id={} username={}", saved.getId(), saved.getUsername());
        return toResponse(saved);
    }

    /**
     * FR-7.1: Update a user's name, phone, and/or roles.
     */
    public UserResponse updateUser(UUID id, UpdateUserRequest req) {
        User user = findUserOrThrow(id);

        if (req.firstName() != null) user.setFirstName(req.firstName());
        if (req.lastName() != null) user.setLastName(req.lastName());
        if (req.phoneNumber() != null) user.setPhoneNumber(req.phoneNumber());

        if (req.roles() != null) {
            if (req.roles().isEmpty()) {
                throw new DomainExceptions.InvalidRequestException("At least one role is required");
            }
            user.setRoles(resolveRoles(req.roles()));
        }

        User saved = userRepository.save(user);
        log.info("Updated user id={}", saved.getId());
        return toResponse(saved);
    }

    /**
     * FR-7.2: Deactivate a user — cannot deactivate own account.
     */
    public UserResponse deactivateUser(UUID targetId, UUID currentUserId) {
        if (targetId.equals(currentUserId)) {
            throw new DomainExceptions.InvalidRequestException(
                    "You cannot deactivate your own account");
        }
        User user = findUserOrThrow(targetId);
        user.setActive(false);
        User saved = userRepository.save(user);
        log.info("Deactivated user id={}", saved.getId());
        return toResponse(saved);
    }

    /**
     * FR-7.2: Reactivate a user.
     */
    public UserResponse reactivateUser(UUID targetId) {
        User user = findUserOrThrow(targetId);
        user.setActive(true);
        User saved = userRepository.save(user);
        log.info("Reactivated user id={}", saved.getId());
        return toResponse(saved);
    }

    /**
     * FR-7.1: Soft-delete by setting deleted_at; @SQLRestriction hides it from future queries.
     */
    public void deleteUser(UUID id) {
        User user = findUserOrThrow(id);
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        log.info("Soft-deleted user id={}", id);
    }

    /**
     * Get a single user by ID.
     */
    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return toResponse(findUserOrThrow(id));
    }

    /**
     * FR-7.1: Paginated list of all users.
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> listAll(Pageable pageable) {
        return PagedResponse.from(userRepository.findAll(pageable), this::toResponse);
    }

    /**
     * List all active users — used by other domains to resolve user IDs.
     */
    @Transactional(readOnly = true)
    public List<UserResponse> listActive() {
        Specification<User> spec = UserSpecification.withFilters(null, null, true);
        return userRepository.findAll(spec).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * FR-7.3: Search users by keyword, role, and/or status.
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> searchUsers(String q, String role, Boolean active, Pageable pageable) {
        Specification<User> spec = UserSpecification.withFilters(q, role, active);
        return PagedResponse.from(userRepository.findAll(spec, pageable), this::toResponse);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "User " + id + " not found"));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                            "Role '" + roleName + "' not found"));
            roles.add(role);
        }
        return roles;
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getPhoneNumber(),
                u.isActive(),
                u.isEmailVerified(),
                u.getRoleNames(),
                u.getLastLoginAt(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }
}
