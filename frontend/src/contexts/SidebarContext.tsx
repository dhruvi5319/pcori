'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(true) // default: icon-only

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed')
    if (stored !== null) setCollapsedState(stored === 'true')
  }, [])

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v)
    localStorage.setItem('sidebar_collapsed', String(v))
  }

  const toggle = () => setCollapsed(!collapsed)

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
