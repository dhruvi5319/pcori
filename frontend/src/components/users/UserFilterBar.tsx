'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { UserRole } from '@/types/user'

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'TAXONOMY_ADMIN', label: 'Taxonomy Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VIEWER', label: 'Viewer' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

interface UserFilterBarProps {
  onFiltersChange?: (filters: { q?: string; role?: string; status?: string }) => void
}

export function UserFilterBar({ onFiltersChange }: UserFilterBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentQ = searchParams.get('q') ?? ''
  const currentRole = searchParams.get('role') ?? ''
  const currentStatus = searchParams.get('status') ?? ''

  const hasActiveFilters = !!(currentQ || currentRole || currentStatus)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F4F6F9] dark:bg-[#141414] rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Keyword search with 300ms debounce */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search username, email, name…"
          defaultValue={currentQ}
          onChange={(e) => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
            searchTimerRef.current = setTimeout(() => {
              updateParam('q', e.target.value || null)
            }, 300)
          }}
          className="w-full h-8 pl-8 pr-3 rounded border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          aria-label="Search username, email, or name"
        />
      </div>

      {/* Role filter */}
      <select
        value={currentRole}
        onChange={(e) => updateParam('role', e.target.value || null)}
        className="h-8 px-3 rounded border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        aria-label="Filter by role"
      >
        <option value="">All Roles</option>
        {ROLE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value || null)}
        className="h-8 px-3 rounded border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        aria-label="Filter by status"
      >
        <option value="">All</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Clear filters link */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-[14px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline
                     focus:outline-none"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
