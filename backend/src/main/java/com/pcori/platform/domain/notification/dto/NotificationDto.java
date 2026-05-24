package com.pcori.platform.domain.notification.dto;

import com.pcori.platform.domain.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        NotificationType type,
        String title,
        String message,
        boolean isRead,
        Instant createdAt
) {}
