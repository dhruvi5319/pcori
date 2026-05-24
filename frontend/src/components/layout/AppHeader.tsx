'use client'

import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  onMobileMenuOpen?: () => void
}

export function AppHeader({ onMobileMenuOpen }: AppHeaderProps) {
  return (
    <header
      className={cn(
        // Sticky, 64px height (UI-SPEC Screen 7)
        'sticky top-0 z-10 h-16 flex items-center justify-between px-4',
        // Glassmorphism (UI-SPEC Advanced Visual Effects §)
        'glass',
        // Border-bottom per UI-SPEC Screen 7
        'border-b border-white/10 dark:border-white/[0.06]'
      )}
    >
      {/* Left: mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        {/* Breadcrumb placeholder for Phase 2+ */}
        <div className="hidden md:block" aria-hidden="true" />
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
