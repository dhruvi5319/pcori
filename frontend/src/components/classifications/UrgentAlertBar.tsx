'use client'
import { AlertTriangle, XCircle } from 'lucide-react'

interface UrgentAlertBarProps { needsReviewCount: number; failedCount: number }

export function UrgentAlertBar({ needsReviewCount, failedCount }: UrgentAlertBarProps) {
  if (needsReviewCount === 0 && failedCount === 0) return null
  return (
    <div className="flex gap-3 flex-wrap">
      {needsReviewCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border
                       bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]
                       border-[#D97706] text-[#D97706] text-[14px]">
          <AlertTriangle className="w-4 h-4" />
          <span>{needsReviewCount} classification{needsReviewCount > 1 ? 's' : ''} need review</span>
        </div>
      )}
      {failedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border
                       bg-[#FEE2E2] dark:bg-[rgba(220,38,38,0.12)]
                       border-[#DC2626] text-[#DC2626] text-[14px]">
          <XCircle className="w-4 h-4" />
          <span>{failedCount} classification{failedCount > 1 ? 's' : ''} failed</span>
        </div>
      )}
    </div>
  )
}
