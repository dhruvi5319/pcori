'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useClassifications } from '@/hooks/useClassifications'
import { ClassificationFilterBar } from '@/components/classifications/ClassificationFilterBar'
import { FilterChip } from '@/components/classifications/FilterChip'
import { UrgentAlertBar } from '@/components/classifications/UrgentAlertBar'
import { ClassificationsTable } from '@/components/classifications/ClassificationsTable'
import { TablePagination } from '@/components/classifications/TablePagination'
import type { ClassificationFilters } from '@/types/classification'

export default function ClassificationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Build filters from URL params
  const filters: ClassificationFilters = {
    status: (searchParams.get('status') as any) || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    pcc: searchParams.get('pcc') || undefined,
    q: searchParams.get('q') || undefined,
    page: Number(searchParams.get('page') ?? 0),
    size: 25,
    sort: searchParams.get('sort') ?? 'uploadedAt,desc',
  }

  const { data, isLoading } = useClassifications(filters)
  const hasActiveFilters = !!(filters.status || filters.startDate || filters.endDate || filters.pcc || filters.q)

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [overrideId, setOverrideId] = useState<string | null>(null)

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSort = (col: string) => {
    const current = filters.sort
    const newSort = current?.startsWith(col) && current.endsWith('asc') ? `${col},desc` : `${col},asc`
    updateParam('sort', newSort)
  }

  const needsReviewCount = data?.content.filter(c => c.status === 'NEEDS_REVIEW').length ?? 0
  const failedCount = data?.content.filter(c => c.status === 'FAILED').length ?? 0

  const handleClearFilters = () => {
    router.push(pathname)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-[14px] text-gray-500">Dashboard › Classifications</nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">Classifications</h1>
        </div>
        {/* Upload Plan CTA — gradient per UI-SPEC §Upload Plan CTA button */}
        <button
          onClick={() => setUploadDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150">
          <Upload className="w-4 h-4" />
          Upload Plan
        </button>
      </div>

      {/* Urgent alert bar — conditional */}
      <UrgentAlertBar needsReviewCount={needsReviewCount} failedCount={failedCount} />

      {/* Filter bar */}
      <ClassificationFilterBar />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && <FilterChip label={filters.status} onRemove={() => updateParam('status', null)} />}
          {filters.q && <FilterChip label={`"${filters.q}"`} onRemove={() => updateParam('q', null)} />}
          {filters.startDate && <FilterChip label={`From ${filters.startDate}`} onRemove={() => updateParam('startDate', null)} />}
          {filters.endDate && <FilterChip label={`To ${filters.endDate}`} onRemove={() => updateParam('endDate', null)} />}
        </div>
      )}

      {/* Table */}
      <ClassificationsTable
        data={data}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        filters={filters}
        onSort={handleSort}
        onView={id => setViewId(id)}
        onOverride={id => setOverrideId(id)}
        onRetry={id => { /* calls POST /api/classifications/{id}/retry — wired in Plan 06 */ }}
        onUpload={() => setUploadDialogOpen(true)}
        onClearFilters={handleClearFilters}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <TablePagination
          page={data.page} totalPages={data.totalPages}
          totalElements={data.totalElements} size={data.size}
          onPage={p => updateParam('page', String(p))}
        />
      )}

      {/* Dialogs — UploadPlanDialog, ViewClassificationDialog — wired in Plan 06 */}
    </div>
  )
}
