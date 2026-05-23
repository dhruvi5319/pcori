'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar()

  return (
    <button
      onClick={toggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'flex items-center justify-center w-full min-h-[44px] rounded-md',
        'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5',
        'transition-colors'
      )}
    >
      {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
    </button>
  )
}
