'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import type { ClassificationStatus } from '@/types/classification'

const STATUS_OPTIONS: Array<{ value: ClassificationStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'CLASSIFIED', label: 'Classified' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review' },
]

export function ClassificationFilterBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 0 when filters change
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  const currentStatus = searchParams.get('status') as ClassificationStatus | null
  const currentQ = searchParams.get('q') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F4F6F9] dark:bg-[#141414] rounded-lg border border-gray-200 dark:border-gray-800">
      {/* Status select */}
      <select
        value={currentStatus ?? ''}
        onChange={(e) => updateParam('status', e.target.value || null)}
        className="h-8 px-3 rounded border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* Date range */}
      <input
        type="date"
        value={startDate}
        onChange={(e) => updateParam('startDate', e.target.value || null)}
        className="h-8 px-2 rounded border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        aria-label="Start date"
      />
      <span className="text-[14px] text-gray-400">–</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => updateParam('endDate', e.target.value || null)}
        className="h-8 px-2 rounded border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-900 text-[14px] text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        aria-label="End date"
      />

      {/* Keyword search with 300ms debounce */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search plan ID or title..."
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
          aria-label="Search by plan ID or title"
        />
      </div>
    </div>
  )
}
