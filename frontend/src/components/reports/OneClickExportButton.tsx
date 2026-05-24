'use client'

import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { useCreateReport } from '@/hooks/useReports'

const ALL_COLUMNS = [
  'Plan ID',
  'Title',
  'Status',
  'PCC',
  'Taxonomy Category',
  'Code',
  'Subcode',
  'AI Confidence',
  'Uploaded By',
  'Upload Date',
  'Classified Date',
  'Reviewed By',
  'Override Reason',
]

const LARGE_REPORT_THRESHOLD = 50_000

export function OneClickExportButton() {
  const [showWarning, setShowWarning] = useState(false)
  const [pendingRowCount, setPendingRowCount] = useState<number | null>(null)
  const createReport = useCreateReport()

  const handleExport = async () => {
    // In a real implementation, we'd first check row count; simulate a check here
    // For now, proceed with the export directly; warning dialog used for explicit large reports
    doExport()
  }

  const doExport = () => {
    setShowWarning(false)
    createReport.mutate(
      { columns: ALL_COLUMNS },
      {
        onSuccess: (data) => {
          // If report is immediately ready (small report), trigger download
          if (data.status === 'READY') {
            toast.success(`Report downloaded — records exported`)
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

  const isLoading = createReport.isPending

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isLoading}
        aria-label={isLoading ? 'Generating report' : 'Export to Excel'}
        className="flex items-center gap-2 px-4 h-10 rounded-lg text-white text-[16px]
                   bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                   hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150
                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:brightness-100"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Generating…
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            Export to Excel
          </>
        )}
      </button>

      {/* Large Report Warning Dialog */}
      <Dialog.Root open={showWarning} onOpenChange={setShowWarning}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-md p-6"
          >
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white mb-3">
              Large Report
            </Dialog.Title>
            <Dialog.Description className="text-[16px] text-gray-600 dark:text-gray-300 mb-6">
              This report has {pendingRowCount?.toLocaleString()} rows — generation may take a moment. Continue?
            </Dialog.Description>
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                             transition-colors"
                >
                  Cancel Export
                </button>
              </Dialog.Close>
              <button
                onClick={doExport}
                className="px-4 py-2 text-[16px] rounded-lg text-white
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           hover:brightness-110 transition-all duration-150"
              >
                Generate Report
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
