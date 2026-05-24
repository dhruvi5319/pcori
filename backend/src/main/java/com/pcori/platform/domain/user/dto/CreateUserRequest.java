package com.pcori.platform.domain.user.dto;

import jakarta.validation.constraints.*;

import java.util.Set;

public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 128) String password,
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @Size(max = 20) String phoneNumber,
    @NotEmpty Set<String> roles
) {}
