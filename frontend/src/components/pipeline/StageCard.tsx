'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { STAGE_STATE_COLORS } from '@/types/pipeline'
import type { PipelineStageDto } from '@/types/pipeline'
import { cn } from '@/lib/utils'

interface StageCardProps {
  stage: PipelineStageDto
  onRetry?: (stageName: string) => void
}

function formatDuration(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatLastRun(lastRunAt: string | null): string {
  if (!lastRunAt) return '—'
  try {
    const date = new Date(lastRunAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}

export function StageCard({ stage, onRetry }: StageCardProps) {
  const stateColor = STAGE_STATE_COLORS[stage.state]
  const isFailed = stage.state === 'FAILED'
  const hasStuck = stage.stuckCount > 0

  return (
    <div
      data-testid={`stage-card-${stage.name}`}
      className={cn(
        'relative rounded-[8px] bg-[var(--color-surface)] overflow-hidden',
        'shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
        'min-w-[200px]'
      )}
      style={{ borderLeft: `4px solid ${stateColor}` }}
    >
      <div className="p-4 space-y-2">
        {/* Stage name */}
        <div className="text-[16px] font-semibold text-[var(--color-foreground)]">
          {stage.name}
        </div>

        {/* State indicator */}
        <div className="flex items-center gap-2">
          <span
            className="rounded-full w-2 h-2 flex-shrink-0"
            style={{ backgroundColor: stateColor }}
            aria-hidden="true"
          />
          <span className="text-[14px] font-normal" style={{ color: stateColor }}>
            {stage.state}
          </span>
        </div>

        {/* Last run / Duration */}
        <div className="text-[14px] font-normal text-[var(--color-muted)] space-y-1">
          <div>Last run: {formatLastRun(stage.lastRunAt)}</div>
          <div>Duration: {formatDuration(stage.lastDurationMs)}</div>
        </div>

        {/* Error message (FAILED state only) */}
        {isFailed && stage.errorMessage && (
          <div className="text-[14px] font-normal text-[#DC2626] dark:text-[#EF4444] break-words">
            Error: &quot;{stage.errorMessage}&quot;
          </div>
        )}

        {/* Retry button (FAILED state only) */}
        {isFailed && onRetry && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onRetry(stage.name)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[14px] font-normal',
                'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]',
                'hover:bg-[var(--color-surface-hover)] transition-colors'
              )}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Retry Stage
            </button>
          </div>
        )}
      </div>

      {/* Stuck Records Banner — always at bottom of card */}
      {hasStuck && (
        <div
          className={cn(
            'px-4 py-2 border-t border-[#D97706]',
            'bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]',
            'flex items-center gap-2'
          )}
        >
          <AlertTriangle
            size={14}
            className="text-[#D97706] flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-[14px] font-normal text-[#D97706]">
            {stage.stuckCount} record(s) stuck in PROCESSING beyond 15 minutes
          </span>
        </div>
      )}
    </div>
  )
}
