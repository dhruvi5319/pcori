'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  return (
    <button
      aria-label="View notifications"
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-md',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
      )}
    >
      <Bell size={18} />
      {/* Badge placeholder — wired in Phase 3 */}
    </button>
  )
}
