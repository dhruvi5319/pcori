'use client'

import { AlertTriangle, XCircle } from 'lucide-react'

interface UrgentAlertBarProps {
  needsReviewCount: number
  failedCount: number
}

export function UrgentAlertBar({ needsReviewCount, failedCount }: UrgentAlertBarProps) {
  if (needsReviewCount === 0 && failedCount === 0) return null

  return (
    <div className="flex gap-3 flex-wrap" role="alert">
      {needsReviewCount > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg border
                     bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]
                     border-[#D97706] dark:border-[rgba(217,119,6,0.4)]
                     text-[#D97706] dark:text-[#FCD34D] text-[14px]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {needsReviewCount} classification{needsReviewCount !== 1 ? 's' : ''} need review
          </span>
        </div>
      )}
      {failedCount > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg border
                     bg-[#FEE2E2] dark:bg-[rgba(220,38,38,0.12)]
                     border-[#DC2626] dark:border-[rgba(220,38,38,0.4)]
                     text-[#DC2626] dark:text-[#F87171] text-[14px]"
        >
          <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {failedCount} classification{failedCount !== 1 ? 's' : ''} failed
          </span>
        </div>
      )}
    </div>
  )
}
