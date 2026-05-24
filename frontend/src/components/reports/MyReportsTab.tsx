'use client'

import { FileSpreadsheet } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useReports, useCreateReport } from '@/hooks/useReports'
import { ReportStatusCell } from './ReportStatusCell'
import type { ExcelReport } from '@/types/report'

function ReportsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} style={{ height: '52px' }} className="border-b border-gray-100 dark:border-gray-800">
          {[140, 200, 140, 120, 80].map((w, j) => (
            <td key={j} className="px-4 py-0">
              <div className="h-4 rounded skeleton-shimmer" style={{ width: `${w}px` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5}>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <div className="text-center">
            <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-2">
              No reports yet
            </h3>
            <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-md">
              Export your first Excel report using the one-click export above or the ad-hoc builder.
            </p>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function MyReportsTab() {
  const { data: reports, isLoading } = useReports()
  const createReport = useCreateReport()
  const isEmpty = !isLoading && (!reports || reports.length === 0)

  const handleRetry = (report: ExcelReport) => {
    createReport.mutate({
      columns: [],
      configurationId: report.configurationId,
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid" aria-label="My Reports">
          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '140px' }}>
                Name
              </th>
              <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '140px' }}>
                Created
              </th>
              <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '80px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <ReportsTableSkeleton />}
            {isEmpty && !isLoading && <EmptyState />}
            {!isLoading &&
              reports?.map((report) => (
                <tr
                  key={report.id}
                  className="group border-b border-gray-100 dark:border-gray-800
                             shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                             hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                             hover:-translate-y-[1px] hover:bg-white dark:hover:bg-[#1A1A1A]
                             bg-[#F4F6F9] dark:bg-[#141414]
                             transition-all duration-150 ease-out"
                  style={{ height: '52px' }}
                >
                  <td className="px-4 py-0 w-[140px]">
                    <span className="text-[14px] text-gray-700 dark:text-gray-300 truncate block max-w-[130px]">
                      {report.configurationId ? `Report ${report.id.slice(0, 8)}` : `Quick Export`}
                    </span>
                  </td>
                  <td className="px-4 py-0">
                    <ReportStatusCell report={report} onRetry={handleRetry} />
                  </td>
                  <td className="px-4 py-0 w-[140px]">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400">
                      {formatDate(report.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-0 w-[80px]">
                    {/* Actions for future extension */}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
