'use client'

import { useState } from 'react'
import { Search, FileSpreadsheet, BookmarkPlus, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useCreateReport } from '@/hooks/useReports'
import { SaveTemplateDialog } from './SaveTemplateDialog'
import type { PreviewResponse, CreateReportRequest } from '@/types/report'

const LARGE_REPORT_THRESHOLD = 50_000

interface ReportPreviewPanelProps {
  selectedColumns: string[]
  filtersJson: string
}

export function ReportPreviewPanel({ selectedColumns, filtersJson }: ReportPreviewPanelProps) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const createReport = useCreateReport()

  const handlePreview = async () => {
    setIsPreviewLoading(true)
    try {
      const params: CreateReportRequest = {
        columns: selectedColumns,
        filtersJson,
      }
      const response = await api.get<PreviewResponse>('/api/reports/preview', { params })
      setPreview(response.data)
    } catch {
      toast.error('Failed to load preview — please try again')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleGenerateExcel = () => {
    createReport.mutate(
      { columns: selectedColumns, filtersJson },
      {
        onSuccess: (data) => {
          if (data.status === 'READY') {
            toast.success('Report downloaded — records exported')
          } else {
            toast.success('Report generating — you\'ll be notified when ready')
          }
        },
        onError: () => {
          toast.error('Report generation failed — try again')
        },
      }
    )
  }

  const sampleColumns = preview?.sampleRows?.[0] ? Object.keys(preview.sampleRows[0]) : []

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-[#1A1A1A] flex flex-col gap-4">
      {/* Section title */}
      <p className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        STEP 3: Preview
      </p>

      {/* Preview Results button */}
      <button
        onClick={handlePreview}
        disabled={isPreviewLoading || selectedColumns.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                   text-[16px] text-gray-700 dark:text-gray-300
                   hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                   disabled:opacity-50 disabled:cursor-not-allowed self-start"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        {isPreviewLoading ? 'Loading…' : 'Preview Results'}
      </button>

      {/* Preview results */}
      {preview && (
        <>
          {/* Row count — 16px/600 bold */}
          <div className="text-[16px] font-semibold text-gray-900 dark:text-white">
            {preview.totalRows.toLocaleString()} matching rows
          </div>

          {/* Large report warning callout */}
          {preview.totalRows > LARGE_REPORT_THRESHOLD && (
            <div
              className="flex items-start gap-2 px-4 py-3 rounded-md"
              style={{
                background: 'var(--large-report-bg, #FEF3C7)',
                borderLeft: '4px solid #D97706',
              }}
            >
              <AlertTriangle className="w-4 h-4 text-[#D97706] mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-[14px] text-[#92400E] dark:text-[#FCD34D]">
                This report has {preview.totalRows.toLocaleString()} rows — generation may take a moment.
              </p>
            </div>
          )}

          {/* Sample table — max-height 240px, 3 sample rows */}
          {preview.sampleRows.length > 0 && (
            <div
              className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700"
              style={{ maxHeight: '240px' }}
            >
              <table className="w-full border-collapse text-[14px]">
                <thead className="sticky top-0 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {sampleColumns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-normal text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.slice(0, 3).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-800 bg-[#F4F6F9] dark:bg-[#141414]"
                    >
                      {sampleColumns.map((col) => (
                        <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Generate Excel — gradient CTA */}
        <button
          onClick={handleGenerateExcel}
          disabled={createReport.isPending || selectedColumns.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
          {createReport.isPending ? 'Generating…' : 'Generate Excel'}
        </button>

        {/* Save as Template — ghost/link button */}
        <button
          onClick={() => setSaveTemplateOpen(true)}
          className="flex items-center gap-1 text-[16px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline"
        >
          <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
          Save as Template
        </button>
      </div>

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        columns={selectedColumns}
        filtersJson={filtersJson}
      />
    </div>
  )
}
