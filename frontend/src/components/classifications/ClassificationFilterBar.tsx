'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'
import type { ClassificationStatus } from '@/types/classification'

// Status options for multi-select dropdown
const STATUS_OPTIONS: ClassificationStatus[] = ['PENDING', 'PROCESSING', 'CLASSIFIED', 'FAILED', 'NEEDS_REVIEW']

export function ClassificationFilterBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, router, pathname])

  const currentStatus = searchParams.get('status') as ClassificationStatus | null
  const currentQ = searchParams.get('q') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''
  const hasFilters = !!(currentStatus || currentQ || startDate || endDate)

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F4F6F9] dark:bg-[#141414] rounded-lg">
      {/* Status multi-select — Radix DropdownMenu pattern */}
      <select
        value={currentStatus ?? ''}
        onChange={e => updateParam('status', e.target.value || null)}
        className="h-8 px-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[14px]"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      {/* Date range */}
      <input type="date" value={startDate} onChange={e => updateParam('startDate', e.target.value || null)}
        className="h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[14px]"
        aria-label="Start date" />
      <span className="text-[14px] text-gray-400">–</span>
      <input type="date" value={endDate} onChange={e => updateParam('endDate', e.target.value || null)}
        className="h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[14px]"
        aria-label="End date" />

      {/* Keyword search — 300ms debounce via useEffect */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search plan ID or title..."
          defaultValue={currentQ}
          onChange={e => {
            clearTimeout((window as any)._searchTimer)
            ;(window as any)._searchTimer = setTimeout(() => updateParam('q', e.target.value || null), 300)
          }}
          className="w-full h-8 pl-8 pr-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[14px]"
        />
      </div>

      {/* Clear filters — visible only when ≥1 active filter per UI-SPEC */}
      {hasFilters && (
        <button onClick={() => router.push(pathname)} className="text-[14px] text-gray-500 hover:text-gray-700 underline">
          Clear Filters
        </button>
      )}
    </div>
  )
}
