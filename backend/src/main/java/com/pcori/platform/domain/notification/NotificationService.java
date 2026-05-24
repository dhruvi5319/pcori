package com.pcori.platform.domain.notification;

import com.pcori.platform.common.exception.DomainExceptions;
import com.pcori.platform.domain.notification.dto.NotificationDto;
import com.pcori.platform.domain.notification.dto.NotificationPreferenceDto;
import com.pcori.platform.domain.notification.dto.UpdatePreferencesRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    /**
     * Dispatches an in-app notification to a user if their preferences allow it.
     * Called from ClassificationPipeline and ClassificationService.
     * Always dispatches IN_APP channel notifications.
     * EMAIL channel is a no-op in Phase 3 (SMTP not configured yet).
     */
    public void dispatch(UUID userId, NotificationType type, String title, String message) {
        // Check if user has disabled this event type for IN_APP channel
        Optional<NotificationPreference> pref = preferenceRepository
                .findByUserIdAndEventTypeAndChannel(userId, type, NotificationChannel.IN_APP);

        boolean shouldNotify = pref.map(NotificationPreference::isEnabled).orElse(true); // default: enabled
        if (!shouldNotify) {
            log.debug("Notification suppressed for userId={} type={} (user preference)", userId, type);
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
        log.debug("Notification dispatched: userId={} type={}", userId, type);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable)
                .map(n -> new NotificationDto(n.getId(), n.getType(), n.getTitle(),
                        n.getMessage(), n.isRead(), n.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(userId);
    }

    public void markRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new DomainExceptions.ResourceNotFoundException(
                        "Notification " + notificationId));
        if (!n.getUserId().equals(userId)) {
            throw new DomainExceptions.ValidationException("Notification does not belong to user");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<NotificationPreferenceDto> getPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId).stream()
                .map(p -> new NotificationPreferenceDto(p.getEventType(), p.getChannel(), p.isEnabled()))
                .toList();
    }

    public List<NotificationPreferenceDto> updatePreferences(UUID userId, UpdatePreferencesRequest req) {
        for (NotificationPreferenceDto dto : req.preferences()) {
            NotificationPreference pref = preferenceRepository
                    .findByUserIdAndEventTypeAndChannel(userId, dto.eventType(), dto.channel())
                    .orElseGet(() -> {
                        NotificationPreference p = new NotificationPreference();
                        p.setUserId(userId);
                        p.setEventType(dto.eventType());
                        p.setChannel(dto.channel());
                        return p;
                    });
            pref.setEnabled(dto.enabled());
            pref.setUpdatedAt(Instant.now());
            preferenceRepository.save(pref);
        }
        return getPreferences(userId);
    }
}
