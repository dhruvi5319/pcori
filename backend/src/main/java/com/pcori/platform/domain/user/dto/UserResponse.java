package com.pcori.platform.domain.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String phoneNumber,
    boolean isActive,
    boolean isEmailVerified,
    List<String> roles,
    Instant lastLoginAt,
    Instant createdAt,
    Instant updatedAt
) {}
