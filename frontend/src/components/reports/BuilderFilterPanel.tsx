'use client'

import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Save } from 'lucide-react'
import { useFilters } from '@/hooks/useReports'
import { SaveFilterDialog } from './SaveFilterDialog'
import type { FilterConfiguration } from '@/types/report'

export interface FilterValues {
  status: string[]
  startDate: string
  endDate: string
  pcc: string
}

interface BuilderFilterPanelProps {
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
}

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'CLASSIFIED', 'NEEDS_REVIEW', 'FAILED']

export function BuilderFilterPanel({ filters, onFiltersChange }: BuilderFilterPanelProps) {
  const { data: savedFilters } = useFilters()
  const [saveFilterOpen, setSaveFilterOpen] = useState(false)

  const handleStatusToggle = (status: string) => {
    const current = filters.status
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    onFiltersChange({ ...filters, status: updated })
  }

  const handleLoadFilter = (filterConfig: FilterConfiguration) => {
    try {
      const criteria = JSON.parse(filterConfig.criteriaJson) as Partial<FilterValues>
      onFiltersChange({
        status: criteria.status ?? [],
        startDate: criteria.startDate ?? '',
        endDate: criteria.endDate ?? '',
        pcc: criteria.pcc ?? '',
      })
    } catch {
      // Invalid JSON in saved filter — ignore
    }
  }

  const criteriaJson = JSON.stringify({
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
    pcc: filters.pcc,
  })

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-[#1A1A1A]">
      {/* Section title */}
      <p className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        STEP 2: Filters
      </p>

      <div className="flex flex-col gap-4">
        {/* Status multi-select */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] text-gray-500 dark:text-gray-400">Status</label>
          <select
            multiple
            value={filters.status}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
              onFiltersChange({ ...filters, status: selected })
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-[#141414] text-[14px] text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            size={Math.min(STATUS_OPTIONS.length, 4)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <p className="text-[12px] text-gray-400">Hold Ctrl/Cmd to select multiple</p>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] text-gray-500 dark:text-gray-400">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
              aria-label="Start date"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-[#141414] text-[14px] text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <span className="flex items-center text-[14px] text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
              aria-label="End date"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-[#141414] text-[14px] text-gray-700 dark:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
        </div>

        {/* PCC text input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="pcc-filter" className="text-[14px] text-gray-500 dark:text-gray-400">
            PCC
          </label>
          <input
            id="pcc-filter"
            type="text"
            value={filters.pcc}
            onChange={(e) => onFiltersChange({ ...filters, pcc: e.target.value })}
            placeholder="Filter by PCC…"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-[#141414] text-[14px] text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                       placeholder:text-gray-400"
          />
        </div>

        {/* Load Saved Filter dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         text-[14px] text-gray-700 dark:text-gray-300 bg-white dark:bg-[#141414]
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              aria-label="Load saved filter"
            >
              Load Saved Filter
              <ChevronDown className="w-4 h-4 ml-auto text-gray-400" aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[220px] rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-[#1A1A1A] shadow-md py-1"
              sideOffset={4}
            >
              {!savedFilters || savedFilters.length === 0 ? (
                <div className="px-3 py-2 text-[14px] text-gray-400">No saved filters</div>
              ) : (
                savedFilters.map((f) => (
                  <DropdownMenu.Item
                    key={f.id}
                    onSelect={() => handleLoadFilter(f)}
                    className="px-3 py-2 text-[14px] text-gray-700 dark:text-gray-300
                               hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
                               focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                  >
                    {f.name}
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Save Filter link button */}
        <button
          onClick={() => setSaveFilterOpen(true)}
          className="flex items-center gap-1 text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline self-start"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          Save Filter
        </button>
      </div>

      <SaveFilterDialog
        open={saveFilterOpen}
        onOpenChange={setSaveFilterOpen}
        criteriaJson={criteriaJson}
      />
    </div>
  )
}
