package com.pcori.platform.domain.notification;

import com.pcori.platform.domain.notification.dto.NotificationDto;
import com.pcori.platform.domain.notification.dto.NotificationPreferenceDto;
import com.pcori.platform.domain.notification.dto.UpdatePreferencesRequest;
import com.pcori.platform.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications?page=&size= — paginated list for authenticated user
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            Authentication auth,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID userId = getUserId(auth);
        return ResponseEntity.ok(notificationService.getNotifications(userId, pageable));
    }

    /**
     * GET /api/notifications/unread-count — integer count of unread notifications
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(getUserId(auth))));
    }

    /**
     * PATCH /api/notifications/{id}/read — mark a specific notification as read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id, Authentication auth) {
        notificationService.markRead(id, getUserId(auth));
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/notifications/read-all — mark all user notifications as read
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notificationService.markAllRead(getUserId(auth));
        return ResponseEntity.ok().build();
    }

    /**
     * GET /api/notifications/preferences — per-user notification preferences
     */
    @GetMapping("/preferences")
    public ResponseEntity<List<NotificationPreferenceDto>> getPreferences(Authentication auth) {
        return ResponseEntity.ok(notificationService.getPreferences(getUserId(auth)));
    }

    /**
     * PUT /api/notifications/preferences — update per-user notification preferences
     */
    @PutMapping("/preferences")
    public ResponseEntity<List<NotificationPreferenceDto>> updatePreferences(
            @RequestBody UpdatePreferencesRequest req, Authentication auth) {
        return ResponseEntity.ok(notificationService.updatePreferences(getUserId(auth), req));
    }

    private UUID getUserId(Authentication auth) {
        User user = (User) auth.getPrincipal();
        return user.getId();
    }
}
