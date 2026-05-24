export type NotificationType =
  | 'CLASSIFICATION_COMPLETED'
  | 'CLASSIFICATION_FAILED'
  | 'CLASSIFICATION_NEEDS_REVIEW'
  | 'PIPELINE_FAILURE'
  | 'OVERRIDE_SUBMITTED';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferenceDto {
  eventType: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface UnreadCountDto { count: number; }
