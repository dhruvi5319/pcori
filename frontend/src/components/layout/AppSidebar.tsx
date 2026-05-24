'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard, FileSearch, TreePine, Workflow,
  BarChart3, FileSpreadsheet, Users, HelpCircle, LucideIcon
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { SidebarNavItem } from './SidebarNavItem'
import { SidebarToggle } from './SidebarToggle'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/user'

// Nav items per UI-SPEC Screen 7 "Sidebar Navigation Items" table — exact routes and roles
// Phase 3 order: Dashboard → Classifications → Analytics (MANAGER+ADMIN) → Data Pipeline (ADMIN) → Taxonomy → …
const NAV_ITEMS: {
  href: string
  label: string
  icon: LucideIcon
  roles?: UserRole[]
}[] = [
  { href: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/classifications', label: 'Classifications',  icon: FileSearch,       roles: ['REVIEWER', 'MANAGER'] },
  { href: '/analytics',       label: 'Analytics',        icon: BarChart3,         roles: ['MANAGER', 'ADMIN'] },
  { href: '/data-pipeline',   label: 'Data Pipeline',    icon: Workflow,          roles: ['ADMIN'] },
  { href: '/taxonomy',        label: 'Taxonomy',         icon: TreePine,          roles: ['TAXONOMY_ADMIN', 'REVIEWER'] },
  { href: '/reports',         label: 'Reports',          icon: FileSpreadsheet,   roles: ['MANAGER', 'VIEWER'] },
  { href: '/users',           label: 'Users',            icon: Users,             roles: ['ADMIN'] },
  { href: '/help',            label: 'Help',             icon: HelpCircle },
]

interface AppSidebarProps {
  /** Mobile drawer mode: show when true, slide off when false */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const { collapsed } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    // Off-canvas drawer for mobile (<768px) per UI-SPEC Responsive Behavior §
    return (
      <>
        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
        {/* Drawer panel */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-40 h-full w-[240px]',
            'glass',  // glassmorphism utility from globals.css
            'border-r transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          aria-label="Navigation"
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
              <span className="text-[16px] font-semibold truncate">PCORI Analytics</span>
            </div>
            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {NAV_ITEMS.map(item => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  roles={item.roles}
                />
              ))}
            </nav>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar (collapsible)
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-20 h-full flex flex-col',
        'glass border-r',
        // Width transition: 56px collapsed ↔ 240px expanded (UI-SPEC §)
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[56px]' : 'w-[240px]'
      )}
      aria-label="Navigation"
    >
      {/* Logo / wordmark */}
      <div className={cn(
        'flex items-center h-16 border-b border-white/10 overflow-hidden',
        collapsed ? 'justify-center px-2' : 'px-4 gap-2'
      )}>
        <LayoutDashboard size={20} className="shrink-0 text-[#1D4ED8] dark:text-[#3B82F6]" aria-hidden />
        {!collapsed && (
          <span className="text-[16px] font-semibold whitespace-nowrap overflow-hidden">
            PCORI Analytics
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            roles={item.roles}
          />
        ))}
      </nav>

      {/* Collapse toggle at bottom */}
      <div className="p-2 border-t border-white/10">
        <SidebarToggle />
      </div>
    </aside>
  )
}
