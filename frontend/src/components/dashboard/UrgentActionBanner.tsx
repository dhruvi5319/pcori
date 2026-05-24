'use client'

import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UrgentActionBannerProps {
  failed: number
  needsReview: number
}

export function UrgentActionBanner({ failed, needsReview }: UrgentActionBannerProps) {
  const router = useRouter()

  if (failed <= 0 && needsReview <= 0) return null

  const parts: string[] = []
  if (needsReview > 0) parts.push(`${needsReview} plan(s) need review`)
  if (failed > 0) parts.push(`${failed} failed`)

  return (
    <div
      data-testid="urgent-action-banner"
      className="flex items-center gap-3 rounded-[8px] px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40"
    >
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
      <span className="text-[14px] font-[400] text-[var(--color-foreground)] flex-1">
        {parts.join(' · ')}
      </span>
      <div className="flex items-center gap-2">
        {needsReview > 0 && (
          <button
            onClick={() => router.push('/classifications?status=NEEDS_REVIEW')}
            className="text-[14px] text-amber-600 dark:text-amber-400 hover:underline"
          >
            View Needs Review →
          </button>
        )}
        {failed > 0 && (
          <button
            onClick={() => router.push('/classifications?status=FAILED')}
            className="text-[14px] text-[#DC2626] dark:text-[#EF4444] hover:underline"
          >
            View Failed →
          </button>
        )}
      </div>
    </div>
  )
}
