'use client'
import { ClassificationRow } from './ClassificationRow'
import { TableSkeletonRows } from './TableSkeletonRows'
import { EmptyClassificationsState } from './EmptyClassificationsState'
import type { Classification, ClassificationFilters } from '@/types/classification'
import type { PagedResponse } from '@/types/api'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface ClassificationsTableProps {
  data?: PagedResponse<Classification>
  isLoading: boolean
  hasActiveFilters: boolean
  filters: ClassificationFilters
  onSort: (column: string) => void
  onView: (id: string) => void
  onOverride: (id: string) => void
  onRetry: (id: string) => void
  onUpload?: () => void
  onClearFilters?: () => void
}

const COLUMNS = [
  { key: 'planId', label: 'Plan ID', width: '120px' },
  { key: 'title', label: 'Title', width: 'flex-1' },
  { key: 'status', label: 'Status', width: '140px' },
  { key: 'pcc', label: 'PCC', width: '160px' },
  { key: 'confidenceScore', label: 'AI Confidence', width: '110px' },
  { key: 'uploadedAt', label: 'Uploaded', width: '110px' },
  { key: 'actions', label: '', width: '80px' },
]

export function ClassificationsTable({ data, isLoading, hasActiveFilters, filters, onSort, onView, onOverride, onRetry, onUpload, onClearFilters }: ClassificationsTableProps) {
  const isEmpty = !isLoading && (!data || data.content.length === 0)

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full border-collapse" role="grid">
        {/* Sticky header — secondary bg per UI-SPEC */}
        <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
          <tr>
            {COLUMNS.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-[14px] font-normal text-gray-500"
                  style={{ width: col.width }}
                  aria-sort={filters.sort?.startsWith(col.key) ? (filters.sort.endsWith('asc') ? 'ascending' : 'descending') : 'none'}>
                {col.key !== 'actions' && col.label ? (
                  <button onClick={() => onSort(col.key)} className="flex items-center gap-1 hover:text-gray-900">
                    {col.label}
                    {filters.sort?.startsWith(col.key) ? (filters.sort.endsWith('asc') ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
                  </button>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && <TableSkeletonRows />}
          {isEmpty && !isLoading && (
            <tr>
              <td colSpan={7}>
                <EmptyClassificationsState hasActiveFilters={hasActiveFilters} onUpload={onUpload} onClearFilters={onClearFilters} />
              </td>
            </tr>
          )}
          {!isLoading && data?.content.map(c => (
            <ClassificationRow key={c.id} classification={c}
              onView={onView} onOverride={onOverride} onRetry={onRetry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
