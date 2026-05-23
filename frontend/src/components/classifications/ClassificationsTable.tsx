'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import { ClassificationRow } from './ClassificationRow'
import { TableSkeletonRows } from './TableSkeletonRows'
import { EmptyClassificationsState } from './EmptyClassificationsState'
import type { Classification, ClassificationFilters } from '@/types/classification'
import type { PagedResponse } from '@/types/api'

interface ClassificationsTableProps {
  data?: PagedResponse<Classification>
  isLoading: boolean
  hasActiveFilters: boolean
  filters: ClassificationFilters
  onSort: (column: string) => void
  onView: (id: string) => void
  onOverride: (id: string) => void
  onRetry: (id: string) => void
  onClearFilters?: () => void
  onUpload?: () => void
}

const COLUMNS = [
  { key: 'planId', label: 'Plan ID', width: '120px', sortable: true },
  { key: 'title', label: 'Title', width: 'auto', sortable: true },
  { key: 'status', label: 'Status', width: '140px', sortable: false },
  { key: 'pcc', label: 'PCC', width: '160px', sortable: true },
  { key: 'confidenceScore', label: 'AI Confidence', width: '110px', sortable: true },
  { key: 'uploadedAt', label: 'Uploaded', width: '110px', sortable: true },
  { key: 'actions', label: '', width: '80px', sortable: false },
]

function getSortIcon(colKey: string, sortParam: string | undefined) {
  if (!sortParam?.startsWith(colKey)) return null
  return sortParam.endsWith('asc') ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  )
}

export function ClassificationsTable({
  data,
  isLoading,
  hasActiveFilters,
  filters,
  onSort,
  onView,
  onOverride,
  onRetry,
  onClearFilters,
  onUpload,
}: ClassificationsTableProps) {
  const isEmpty = !isLoading && (!data || data.content.length === 0)

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid" aria-label="Classifications">
          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  style={{ width: col.width }}
                  aria-sort={
                    filters.sort?.startsWith(col.key)
                      ? filters.sort.endsWith('asc')
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      {col.label}
                      {getSortIcon(col.key, filters.sort)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <TableSkeletonRows />}
            {isEmpty && !isLoading && (
              <tr>
                <td colSpan={7}>
                  <EmptyClassificationsState
                    hasActiveFilters={hasActiveFilters}
                    onUpload={onUpload}
                    onClearFilters={onClearFilters}
                  />
                </td>
              </tr>
            )}
            {!isLoading &&
              data?.content.map((c) => (
                <ClassificationRow
                  key={c.id}
                  classification={c}
                  onView={onView}
                  onOverride={onOverride}
                  onRetry={onRetry}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
