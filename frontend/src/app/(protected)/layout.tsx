'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
// AppHeader renders: hamburger | [ThemeToggle] [NotificationBell] [UserMenu]
import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      {/* Main content area — offset by sidebar width on desktop */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-[padding-left] duration-200 ease-out',
          // Desktop: pad left for sidebar (UI-SPEC widths)
          collapsed ? 'md:pl-[56px]' : 'md:pl-[240px]'
        )}
      >
        <AppHeader onMobileMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [isAuthenticated, router])

  if (!checked) {
    // Minimal loading state while auth check runs (prevents flash of protected content)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  )
}
