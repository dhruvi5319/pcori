'use client'

import { cn } from '@/lib/utils'
import type { ClassificationStatus } from '@/types/classification'

const STATUS_CONFIG: Record<
  ClassificationStatus,
  { label: string; dotBg: string; textColor: string; badgeBg: string }
> = {
  CLASSIFIED: {
    label: 'Classified',
    dotBg: 'bg-[#16A34A]',
    textColor: 'text-[#16A34A] dark:text-[#4ADE80]',
    badgeBg: 'bg-[#DCFCE7] dark:bg-[rgba(22,163,74,0.15)]',
  },
  PROCESSING: {
    label: 'Processing',
    dotBg: 'bg-[#2563EB]',
    textColor: 'text-[#2563EB] dark:text-[#60A5FA]',
    badgeBg: 'bg-[#DBEAFE] dark:bg-[rgba(37,99,235,0.15)]',
  },
  PENDING: {
    label: 'Pending',
    dotBg: 'bg-[#6B7280]',
    textColor: 'text-[#6B7280] dark:text-[#9CA3AF]',
    badgeBg: 'bg-[#F3F4F6] dark:bg-[rgba(107,114,128,0.15)]',
  },
  FAILED: {
    label: 'Failed',
    dotBg: 'bg-[#DC2626]',
    textColor: 'text-[#DC2626] dark:text-[#F87171]',
    badgeBg: 'bg-[#FEE2E2] dark:bg-[rgba(220,38,38,0.15)]',
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    dotBg: 'bg-[#D97706]',
    textColor: 'text-[#D97706] dark:text-[#FCD34D]',
    badgeBg: 'bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.15)]',
  },
}

interface StatusBadgeProps {
  status: ClassificationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const isProcessing = status === 'PROCESSING'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[14px] font-normal',
        config.badgeBg,
        config.textColor,
        className
      )}
    >
      {/* Color dot — PROCESSING gets animate-ping ring per UI-SPEC CSS */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isProcessing && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75 animate-ping"
            aria-hidden="true"
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotBg)} />
      </span>
      {/* Text label — color is never the sole indicator per WCAG */}
      <span>{config.label}</span>
    </span>
  )
}
