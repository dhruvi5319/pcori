'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationUnreadCount } from '@/hooks/useNotifications'
import { NotificationDrawer } from './NotificationDrawer'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: unreadData } = useNotificationUnreadCount()

  // Optimistic: when drawer is open, visually show 0 (badge hidden)
  const displayCount = isOpen ? 0 : (unreadData?.count ?? 0)
  const showBadge = displayCount > 0
  const badgeLabel = displayCount > 99 ? '99+' : String(displayCount)

  return (
    <>
      <button
        data-testid="notification-bell"
        aria-label="View notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-md',
          'text-gray-500 dark:text-gray-400',
          'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
        )}
      >
        <Bell size={24} />
        {/* Unread badge */}
        <span
          aria-live="polite"
          style={{ display: showBadge ? 'flex' : 'none' }}
          className={cn(
            'absolute top-0 right-0 translate-x-1/2 -translate-y-1/2',
            'bg-[#DC2626] text-white text-[10px] rounded-full',
            'min-w-[20px] h-[20px] flex items-center justify-center px-1',
            'pointer-events-none'
          )}
          aria-label={showBadge ? `${badgeLabel} unread notifications` : undefined}
        >
          {badgeLabel}
        </span>
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
