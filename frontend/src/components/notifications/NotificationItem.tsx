'use client'

import { FileCheck, XCircle, AlertTriangle, AlertOctagon, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NotificationDto, NotificationType } from '@/types/notification'

interface NotificationItemProps {
  notification: NotificationDto
  onMarkRead: (id: string) => void
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'CLASSIFICATION_COMPLETED':
      return <FileCheck size={20} className="text-[#16A34A] flex-shrink-0" aria-hidden="true" />
    case 'CLASSIFICATION_FAILED':
      return <XCircle size={20} className="text-[#DC2626] flex-shrink-0" aria-hidden="true" />
    case 'CLASSIFICATION_NEEDS_REVIEW':
      return <AlertTriangle size={20} className="text-[#D97706] flex-shrink-0" aria-hidden="true" />
    case 'PIPELINE_FAILURE':
      return <AlertOctagon size={20} className="text-[#DC2626] flex-shrink-0" aria-hidden="true" />
    case 'OVERRIDE_SUBMITTED':
      return (
        <Edit
          size={20}
          className="text-[#1D4ED8] dark:text-[#3B82F6] flex-shrink-0"
          aria-hidden="true"
        />
      )
  }
}

function formatTimestamp(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const router = useRouter()

  function handleActivate() {
    onMarkRead(notification.id)
    // Navigate to related record if applicable
    if (
      notification.type === 'CLASSIFICATION_COMPLETED' ||
      notification.type === 'CLASSIFICATION_FAILED' ||
      notification.type === 'CLASSIFICATION_NEEDS_REVIEW'
    ) {
      router.push('/classifications')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleActivate()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        'px-4 py-2 flex items-start gap-3 cursor-pointer',
        'border-b border-black/[0.06] dark:border-white/[0.04]',
        'hover:bg-accent/8 transition-colors focus-visible:outline-none focus-visible:bg-accent/8',
        notification.isRead
          ? 'bg-[#F4F6F9] dark:bg-[#141414]'
          : 'bg-white dark:bg-[#1A1A1A]'
      )}
    >
      {/* Type icon */}
      <div className="mt-0.5">
        {getTypeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + timestamp row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-[600] truncate leading-[1.4]">
            {notification.title}
          </span>
          <span className="text-[14px] font-[400] text-muted-foreground whitespace-nowrap flex-shrink-0 leading-[1.4]">
            {formatTimestamp(notification.createdAt)}
          </span>
        </div>

        {/* Body — 2-line clamp */}
        <p
          className="text-[14px] font-[400] text-muted-foreground mt-0.5 leading-[1.4]"
          style={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {notification.message}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div
          className="mt-1.5 w-2 h-2 rounded-full bg-[#DC2626] flex-shrink-0"
          aria-label="Unread"
        />
      )}
    </div>
  )
}
