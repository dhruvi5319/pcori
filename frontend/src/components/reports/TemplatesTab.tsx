'use client'

import { BookmarkX } from 'lucide-react'
import { useReportTemplates } from '@/hooks/useReports'
import { TemplatesTable } from './TemplatesTable'

function TemplatesSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4 px-4 py-3 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
        {[200, 120, 120, 80].map((w, i) => (
          <div key={i} className="h-4 rounded skeleton-shimmer" style={{ width: `${w}px` }} />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 border-b border-gray-100 dark:border-gray-800 bg-[#F4F6F9] dark:bg-[#141414]"
          style={{ height: '52px' }}
        >
          {[200, 120, 120, 80].map((w, j) => (
            <div key={j} className="h-4 rounded skeleton-shimmer" style={{ width: `${w}px` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <BookmarkX className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <div className="text-center">
        <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-2">
          No saved templates
        </h3>
        <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-md">
          Use the ad-hoc builder to create and save a report template for future use.
        </p>
      </div>
    </div>
  )
}

export function TemplatesTab() {
  const { data: templates, isLoading } = useReportTemplates()
  const isEmpty = !isLoading && (!templates || templates.length === 0)

  if (isLoading) return <TemplatesSkeleton />
  if (isEmpty) return <EmptyState />

  return <TemplatesTable templates={templates!} />
}
