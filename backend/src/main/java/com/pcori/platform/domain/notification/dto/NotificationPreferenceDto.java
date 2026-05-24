package com.pcori.platform.domain.notification.dto;

import com.pcori.platform.domain.notification.NotificationChannel;
import com.pcori.platform.domain.notification.NotificationType;

public record NotificationPreferenceDto(
        NotificationType eventType,
        NotificationChannel channel,
        boolean enabled
) {}
