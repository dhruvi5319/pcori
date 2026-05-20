package com.pcori.platform.domain.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserRegisteredResponse {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Instant createdAt;
}
