'use client'

import { cn } from '@/lib/utils'

interface StatusBreakdownRowProps {
  pending: number
  failed: number
  needsReview: number
  isLoading?: boolean
}

interface StatusCardProps {
  label: string
  count: number
  dotColor: string
  isLoading?: boolean
}

function StatusCard({ label, count, dotColor, isLoading }: StatusCardProps) {
  if (isLoading) {
    return (
      <div className="skeleton-shimmer rounded-[12px] h-[72px]" aria-hidden="true" />
    )
  }

  return (
    <div
      className={cn(
        'rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
        'bg-[var(--color-surface)] p-4',
        'flex items-center gap-3'
      )}
    >
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] font-[600] text-[var(--color-foreground)] leading-none">
          {count}
        </span>
        <span className="text-[14px] font-[400] text-[var(--color-muted)]">{label}</span>
      </div>
    </div>
  )
}

export function StatusBreakdownRow({
  pending,
  failed,
  needsReview,
  isLoading = false,
}: StatusBreakdownRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatusCard
        label="Pending"
        count={pending}
        dotColor="#6B7280"
        isLoading={isLoading}
      />
      <StatusCard
        label="Failed"
        count={failed}
        dotColor="#DC2626"
        isLoading={isLoading}
      />
      <StatusCard
        label="Needs Review"
        count={needsReview}
        dotColor="#D97706"
        isLoading={isLoading}
      />
    </div>
  )
}
