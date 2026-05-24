'use client'

import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { data: notificationsData, refetch } = useNotifications(0, 20)
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Refetch notifications when drawer opens
  useEffect(() => {
    if (isOpen) {
      refetch()
    }
  }, [isOpen, refetch])

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus first focusable element in drawer
    const timer = setTimeout(() => {
      drawerRef.current?.focus()
    }, 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const notifications = notificationsData?.content ?? []

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-30 transition-opacity duration-250',
            'bg-black/30 dark:bg-black/50'
          )}
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Notifications panel"
        aria-modal="true"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'notification-drawer',
          'fixed right-0 top-16 z-40',
          'w-[380px]',
          'bg-[#F4F6F9] dark:bg-[#141414]',
          'border-l border-black/10 dark:border-white/[0.08]',
          'shadow-[-8px_0_32px_rgba(0,0,0,0.12),-4px_0_8px_rgba(0,0,0,0.08)]',
          'flex flex-col',
          'focus-visible:outline-none'
        )}
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-black/[0.06] dark:border-white/[0.04]">
          <h2 className="text-[24px] font-[600] leading-[1.2]">Notifications</h2>
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className={cn(
              'text-[14px] font-[400] text-[#1D4ED8] dark:text-[#3B82F6]',
              'hover:underline focus-visible:outline-none focus-visible:underline',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Mark all as read
          </button>
        </div>

        {/* Notification list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Bell size={32} aria-hidden="true" />
              <span className="text-[14px] font-[400]">No notifications</span>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
