package com.pcori.platform.domain.user.dto;

import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateUserRequest(
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Size(max = 20) String phoneNumber,
    Set<String> roles
) {}
