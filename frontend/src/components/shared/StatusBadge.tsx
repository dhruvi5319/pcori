'use client'
import { cn } from '@/lib/utils'
import type { ClassificationStatus } from '@/types/classification'

const STATUS_CONFIG: Record<ClassificationStatus, {
  label: string
  dotBg: string
  textColor: string
  badgeBg: string
}> = {
  CLASSIFIED:   { label: 'Classified',   dotBg: 'bg-[#16A34A]', textColor: 'text-[#16A34A]', badgeBg: 'bg-[#DCFCE7]' },
  PROCESSING:   { label: 'Processing',   dotBg: 'bg-[#2563EB]', textColor: 'text-[#2563EB]', badgeBg: 'bg-[#DBEAFE]' },
  PENDING:      { label: 'Pending',      dotBg: 'bg-[#6B7280]', textColor: 'text-[#6B7280]', badgeBg: 'bg-[#F3F4F6]' },
  FAILED:       { label: 'Failed',       dotBg: 'bg-[#DC2626]', textColor: 'text-[#DC2626]', badgeBg: 'bg-[#FEE2E2]' },
  NEEDS_REVIEW: { label: 'Needs Review', dotBg: 'bg-[#D97706]', textColor: 'text-[#D97706]', badgeBg: 'bg-[#FEF3C7]' },
}

export function StatusBadge({ status }: { status: ClassificationStatus }) {
  const config = STATUS_CONFIG[status]
  const isProcessing = status === 'PROCESSING'

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[14px] font-normal', config.badgeBg, config.textColor)}>
      {/* Color dot — PROCESSING gets animate-ping ring per UI-SPEC CSS */}
      <span className="relative flex h-2 w-2">
        {isProcessing && (
          /* animate-ping ring: before:animate-ping before:absolute before:inset-[-4px] before:rounded-full before:bg-blue-500 */
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75 animate-ping" />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotBg)} />
      </span>
      {/* Text label — WCAG: color is never sole indicator */}
      <span>{config.label}</span>
    </span>
  )
}
