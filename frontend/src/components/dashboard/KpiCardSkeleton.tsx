'use client'

import { cn } from '@/lib/utils'

interface KpiCardSkeletonProps {
  className?: string
}

export function KpiCardSkeleton({ className }: KpiCardSkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-[12px] min-h-[120px]',
        className
      )}
      aria-hidden="true"
    />
  )
}
