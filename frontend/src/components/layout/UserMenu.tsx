'use client'

import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { toast } from 'sonner'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const router = useRouter()
  const { getClaims, clearTokens } = useAuth()
  const claims = getClaims()
  const username = claims?.username ?? 'User'
  // Initials for avatar circle
  const initials = username.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore errors — still clear tokens and redirect
    } finally {
      clearTokens()
      // Per UI-SPEC Copywriting Contract: "You've been signed out." (sonner muted)
      toast('You\'ve been signed out.')
      router.push('/login')
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-2 py-1 rounded-md',
            'text-sm font-medium text-gray-700 dark:text-gray-200',
            'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
            'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
            'min-h-[44px]'  // WCAG touch target
          )}
          aria-label={`User menu — ${username}`}
        >
          {/* Avatar circle with initials */}
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full shrink-0',
            'bg-[#1D4ED8] dark:bg-[#3B82F6] text-white text-xs font-semibold'
          )}>
            {initials}
          </div>
          <span className="hidden sm:block max-w-[120px] truncate">{username}</span>
          <ChevronDown size={14} className="text-gray-400 shrink-0" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[180px] rounded-lg overflow-hidden',
            'bg-white dark:bg-[#1a1a1a]',
            // E3 Floating shadow per UI-SPEC Card Elevation
            'shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]',
            'dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.3)]',
            'border border-black/5 dark:border-white/10',
            'py-1'
          )}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 outline-none"
            onSelect={() => {/* Profile — Phase 2+ */}}
          >
            <User size={14} aria-hidden />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 outline-none"
            onSelect={() => {/* Settings — Phase 2+ */}}
          >
            <Settings size={14} aria-hidden />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 border-t border-black/5 dark:border-white/10" />

          {/* Sign Out — NOT destructive per UI-SPEC Destructive Actions § */}
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 outline-none"
            onSelect={handleLogout}
          >
            <LogOut size={14} aria-hidden />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
