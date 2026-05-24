'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, Download, AlertTriangle, Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfidenceGauge } from './ConfidenceGauge'
import { useClassificationDetail } from '@/hooks/useClassificationDetail'
import api from '@/lib/api'
import { toast } from 'sonner'

interface DownloadUrlResponse {
  url: string
  expiresAt: string
}

interface ViewClassificationDialogProps {
  classificationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOverride: (id: string) => void
}

export function ViewClassificationDialog({
  classificationId,
  open,
  onOpenChange,
  onOverride,
}: ViewClassificationDialogProps) {
  const { data: c, isLoading } = useClassificationDetail(classificationId)

  const handleDownload = async () => {
    if (!c?.fileId) return
    try {
      const res = await api.get<DownloadUrlResponse>(`/api/files/${c.fileId}/download-url`)
      window.open(res.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Download failed — please try again')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#141414] rounded-xl w-full max-w-[720px] max-h-[90vh]
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col
                     focus:outline-none"
          aria-describedby="view-dialog-description"
        >
          {isLoading || !c ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[14px] font-semibold">{c.planId}</span>
                  <StatusBadge status={c.status} />
                </div>
                <Dialog.Close asChild>
                  <button
                    aria-label="Close dialog"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* NEEDS_REVIEW banner */}
              {c.status === 'NEEDS_REVIEW' && (
                <div
                  className="flex items-center gap-2 px-6 py-3
                             bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]
                             border-b border-[#D97706] dark:border-[rgba(217,119,6,0.4)]
                             text-[#D97706] dark:text-[#FCD34D]"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-[14px]">
                    AI confidence below threshold — please review this classification
                  </span>
                </div>
              )}

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
                <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
                  {c.title ?? c.planId}
                </Dialog.Title>

                <p id="view-dialog-description" className="sr-only">
                  Full classification details for {c.planId}
                </p>

                {/* Extraction warning */}
                {c.extractionWarning && (
                  <div
                    className="flex items-start gap-2 p-4 rounded-lg
                               bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]
                               border border-[#D97706] border-l-4
                               text-[#D97706] dark:text-[#FCD34D]"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-[14px]">{c.extractionWarning}</p>
                  </div>
                )}

                {/* AI Classification */}
                <section>
                  <h3 className="text-[16px] font-semibold mb-3 text-gray-900 dark:text-white">
                    AI Classification
                  </h3>
                  <div className="grid grid-cols-[1fr_auto] gap-6">
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'PCC', value: c.pcc },
                        { label: 'Taxonomy Category', value: c.taxonomyCategory },
                        { label: 'Taxonomy Code', value: c.taxonomyCode },
                        { label: 'Taxonomy Subcode', value: c.taxonomySubcode },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[14px] text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="text-[16px] text-gray-900 dark:text-gray-100">
                            {value ?? '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                    {c.confidenceScore != null && (
                      <div>
                        <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-2">
                          AI Confidence
                        </p>
                        <ConfidenceGauge score={c.confidenceScore} />
                      </div>
                    )}
                  </div>
                </section>

                {/* Research Details */}
                <section>
                  <h3 className="text-[16px] font-semibold mb-3 text-gray-900 dark:text-white">
                    Research Details (Extracted)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {[
                      ['Project Summary', c.projectSummary],
                      ['Population Setting', c.populationSetting],
                      ['Intervention', c.intervention],
                      ['Comparator', c.comparator],
                      ['Primary Outcome', c.primaryOutcome],
                      ['Secondary Outcomes', c.secondaryOutcomes],
                    ]
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-[14px] text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="text-[16px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                            {value}
                          </p>
                        </div>
                      ))}
                  </div>
                </section>

                {/* Pipeline Metadata */}
                <section>
                  <h3 className="text-[16px] font-semibold mb-3 text-gray-900 dark:text-white">
                    Pipeline Metadata
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[14px]">
                    <div>
                      <span className="text-gray-500">Model Version </span>
                      <span className="font-mono">{c.modelVersion ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing Time </span>
                      {c.processingTimeMs ? `${c.processingTimeMs}ms` : '—'}
                    </div>
                    <div>
                      <span className="text-gray-500">Classified At </span>
                      {c.classifiedAt ? new Date(c.classifiedAt).toLocaleString() : '—'}
                    </div>
                    <div>
                      <span className="text-gray-500">File </span>
                      {c.fileName ?? '—'}
                    </div>
                  </div>
                </section>

                {/* Override Record — shown when reviewedBy is set */}
                {c.reviewedBy && (
                  <section className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-[#F4F6F9] dark:bg-[#111111]">
                    <h3 className="text-[14px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                      Override Applied
                    </h3>
                    <p className="text-[14px] text-gray-900 dark:text-gray-100">
                      Reviewed by <strong>{c.reviewedBy}</strong> ·{' '}
                      {c.reviewedAt ? new Date(c.reviewedAt).toLocaleDateString() : '—'}
                    </p>
                    {c.overrideReason && (
                      <p className="mt-2 text-[16px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        <span className="font-medium">Reason: </span>
                        {c.overrideReason}
                      </p>
                    )}
                  </section>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleDownload}
                  disabled={!c.fileId}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Download link expires in 15 minutes"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download PDF
                </button>
                <button
                  onClick={() => c && onOverride(c.id)}
                  className="px-4 py-2 rounded-lg text-white text-[16px]
                             bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                             hover:brightness-110 hover:-translate-y-0.5 transition-all duration-150"
                >
                  Override Classification
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
