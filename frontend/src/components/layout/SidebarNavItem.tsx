'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import { LucideIcon, LucideProps } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'
import { UserRole } from '@/types/user'
import { useAuth } from '@/hooks/useAuth'

// Accept both LucideIcon (ForwardRef) and compatible React components
type IconComponent = LucideIcon | React.ComponentType<LucideProps>

interface SidebarNavItemProps {
  href: string
  label: string
  icon: IconComponent
  roles?: UserRole[]  // if undefined: visible to all authenticated users
}

export function SidebarNavItem({ href, label, icon: Icon, roles }: SidebarNavItemProps) {
  const { collapsed } = useSidebar()
  const pathname = usePathname()
  const { getClaims } = useAuth()

  // Role gate: hide item if user lacks required role
  if (roles && roles.length > 0) {
    const claims = getClaims()
    const userRoles = claims?.roles ?? []
    const hasAccess = roles.some(r => userRoles.includes(r))
    if (!hasAccess) return null
  }

  const isActive = pathname === href || pathname.startsWith(href + '/')

  const itemContent = (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-md transition-colors',
        'min-h-[44px] px-3',  // WCAG 44px touch target
        collapsed ? 'justify-center px-0 w-full' : 'pr-3',
        isActive
          ? 'text-[#1D4ED8] dark:text-[#3B82F6] font-semibold bg-blue-50 dark:bg-blue-950/30'
          : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5',
        // Active left border accent (4px brand blue — UI-SPEC Screen 7)
        isActive && 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#1D4ED8] dark:before:bg-[#3B82F6] before:rounded-l-md'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={collapsed ? 24 : 20}
        className={cn(
          'shrink-0',
          isActive ? 'text-[#1D4ED8] dark:text-[#3B82F6]' : 'text-gray-500 dark:text-gray-400'
        )}
        aria-hidden={true}
      />
      {!collapsed && (
        <span className="text-[16px] leading-[1.5] truncate">{label}</span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{itemContent}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="right"
              sideOffset={8}
              className="z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg"
            >
              {label}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    )
  }

  return itemContent
}
