'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { useClassifications } from '@/hooks/useClassifications'
import { useClassificationDetail } from '@/hooks/useClassificationDetail'
import { ClassificationFilterBar } from '@/components/classifications/ClassificationFilterBar'
import { FilterChip } from '@/components/classifications/FilterChip'
import { UrgentAlertBar } from '@/components/classifications/UrgentAlertBar'
import { ClassificationsTable } from '@/components/classifications/ClassificationsTable'
import { TablePagination } from '@/components/classifications/TablePagination'
import { UploadPlanDialog } from '@/components/classifications/UploadPlanDialog'
import { ViewClassificationDialog } from '@/components/classifications/ViewClassificationDialog'
import { ManualOverrideDialog } from '@/components/classifications/ManualOverrideDialog'
import { RetryConfirmDialog } from '@/components/classifications/RetryConfirmDialog'
import type { ClassificationFilters } from '@/types/classification'

export default function ClassificationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // Build filters from URL params
  const filters: ClassificationFilters = {
    status: (searchParams.get('status') as ClassificationFilters['status']) || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    pcc: searchParams.get('pcc') || undefined,
    q: searchParams.get('q') || undefined,
    page: Number(searchParams.get('page') ?? 0),
    size: 25,
    sort: searchParams.get('sort') ?? 'uploadedAt,desc',
  }

  const { data, isLoading } = useClassifications(filters)
  const hasActiveFilters = !!(
    filters.status ||
    filters.startDate ||
    filters.endDate ||
    filters.pcc ||
    filters.q
  )

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [retryId, setRetryId] = useState<string | null>(null)

  // Fetch detail for override dialog
  const { data: overrideClassification } = useClassificationDetail(overrideId)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key !== 'page') params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const handleSort = useCallback(
    (col: string) => {
      const current = filters.sort
      const newSort =
        current?.startsWith(col) && current.endsWith('asc') ? `${col},desc` : `${col},asc`
      updateParam('sort', newSort)
    },
    [filters.sort, updateParam]
  )

  const handleRetry = useCallback(
    (id: string) => {
      setRetryId(id)
    },
    []
  )

  const needsReviewCount = data?.content.filter((c) => c.status === 'NEEDS_REVIEW').length ?? 0
  const failedCount = data?.content.filter((c) => c.status === 'FAILED').length ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-[14px] text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            Dashboard › Classifications
          </nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">
            Classifications
          </h1>
        </div>
        {/* Upload Plan CTA — gradient per UI-SPEC */}
        <button
          onClick={() => setUploadDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload Plan
        </button>
      </div>

      {/* Urgent alert bar — conditional */}
      <UrgentAlertBar needsReviewCount={needsReviewCount} failedCount={failedCount} />

      {/* Filter bar */}
      <ClassificationFilterBar />

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.status && (
            <FilterChip
              label={filters.status.replace('_', ' ')}
              onRemove={() => updateParam('status', null)}
            />
          )}
          {filters.q && (
            <FilterChip label={`"${filters.q}"`} onRemove={() => updateParam('q', null)} />
          )}
          {filters.startDate && (
            <FilterChip
              label={`From ${filters.startDate}`}
              onRemove={() => updateParam('startDate', null)}
            />
          )}
          {filters.endDate && (
            <FilterChip
              label={`To ${filters.endDate}`}
              onRemove={() => updateParam('endDate', null)}
            />
          )}
          <button
            onClick={clearAllFilters}
            className="text-[14px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Table */}
      <ClassificationsTable
        data={data}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        filters={filters}
        onSort={handleSort}
        onView={(id) => setViewId(id)}
        onOverride={(id) => setOverrideId(id)}
        onRetry={handleRetry}
        onClearFilters={clearAllFilters}
        onUpload={() => setUploadDialogOpen(true)}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <TablePagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={data.size}
          onPage={(p) => updateParam('page', String(p))}
        />
      )}

      {/* Dialogs */}
      <UploadPlanDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />

      <ViewClassificationDialog
        classificationId={viewId}
        open={!!viewId}
        onOpenChange={(open) => !open && setViewId(null)}
        onOverride={(id) => {
          setViewId(null)
          setOverrideId(id)
        }}
      />

      <ManualOverrideDialog
        classification={overrideClassification ?? null}
        open={!!overrideId}
        onOpenChange={(open) => !open && setOverrideId(null)}
      />

      <RetryConfirmDialog
        classificationId={retryId}
        open={!!retryId}
        onOpenChange={(open) => !open && setRetryId(null)}
      />
    </div>
  )
}
