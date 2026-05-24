'use client'

import { Download, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { ExcelReport } from '@/types/report'

interface ReportStatusCellProps {
  report: ExcelReport
  onRetry?: (report: ExcelReport) => void
}

export function ReportStatusCell({ report, onRetry }: ReportStatusCellProps) {
  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/reports/${report.id}/download`, {
        responseType: 'blob',
      })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${report.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed — please try again')
    }
  }

  if (report.status === 'GENERATING') {
    return (
      <div className="flex items-center gap-2">
        {/* animate-ping blue dot — same pattern as PROCESSING in Phase 2 */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
        </span>
        <span className="text-[14px] text-[#2563EB]">Generating…</span>
      </div>
    )
  }

  if (report.status === 'READY') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
          <span className="text-[14px] text-gray-700 dark:text-gray-300">Ready</span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline"
          aria-label={`Download report ${report.id}`}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download Report
        </button>
      </div>
    )
  }

  if (report.status === 'FAILED') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#DC2626]" aria-hidden="true" />
          <span className="text-[14px] text-gray-700 dark:text-gray-300">Failed</span>
        </div>
        {onRetry && (
          <button
            onClick={() => onRetry(report)}
            className="flex items-center gap-1 text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline"
            aria-label={`Retry report ${report.id}`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    )
  }

  return null
}
