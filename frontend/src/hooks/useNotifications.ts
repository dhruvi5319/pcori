import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { NotificationDto, NotificationPreferenceDto, UnreadCountDto } from '@/types/notification'
import type { PagedResponse } from '@/types/api'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => [...NOTIFICATION_KEYS.all, 'list', page, size] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, 'preferences'] as const,
}

/**
 * Polls unread count every 30s unconditionally (always-on per UI-SPEC §Screen 4)
 */
export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () =>
      api.get<UnreadCountDto>('/api/notifications/unread-count').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

/**
 * Fetches paginated notification list.
 * Not polled — stale until panel opens (caller refetches on open).
 */
export function useNotifications(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, size),
    queryFn: () =>
      api
        .get<PagedResponse<NotificationDto>>('/api/notifications', { params: { page, size } })
        .then((r) => r.data),
    staleTime: 30_000,
  })
}

/**
 * Marks a single notification as read.
 * Invalidates unread count + notifications list on success.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<void>(`/api/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

/**
 * Marks all notifications as read.
 * Invalidates unread count + notifications list on success.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<void>('/api/notifications/read-all').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

/**
 * Fetches notification preferences.
 * staleTime: Infinity — fetched once per session, invalidated on save.
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: () =>
      api
        .get<NotificationPreferenceDto[]>('/api/notifications/preferences')
        .then((r) => r.data),
    staleTime: Infinity,
  })
}

/**
 * Updates notification preferences.
 * Invalidates preferences cache on success and shows success toast.
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (preferences: NotificationPreferenceDto[]) =>
      api
        .put<NotificationPreferenceDto[]>('/api/notifications/preferences', preferences)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences() })
      toast.success('Preferences saved', { richColors: true })
    },
    onError: () => {
      toast.error('Failed to save preferences — try again', { richColors: true })
    },
  })
}
