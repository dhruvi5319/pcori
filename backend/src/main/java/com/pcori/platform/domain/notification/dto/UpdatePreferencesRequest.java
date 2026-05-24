package com.pcori.platform.domain.notification.dto;

import java.util.List;

public record UpdatePreferencesRequest(
        List<NotificationPreferenceDto> preferences
) {}
