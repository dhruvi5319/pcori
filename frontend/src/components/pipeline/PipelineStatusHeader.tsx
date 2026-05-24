'use client'

import { PIPELINE_STATE_COLORS } from '@/types/pipeline'
import type { PipelineStatusDto } from '@/types/pipeline'
import { formatDistanceToNow } from 'date-fns'

interface PipelineStatusHeaderProps {
  status: PipelineStatusDto
}

function PipelineStatusSkeleton() {
  return (
    <div
      className="w-full h-20 rounded-[8px] bg-[var(--color-surface)] skeleton-shimmer"
      role="status"
      aria-label="Loading pipeline status"
    />
  )
}

function formatLastSync(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Never'
  try {
    return formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export function PipelineStatusHeader({ status }: PipelineStatusHeaderProps) {
  const stateColor = PIPELINE_STATE_COLORS[status.state]

  return (
    <div
      data-testid="pipeline-status-header"
      className="w-full h-20 px-6 flex items-center justify-between rounded-[8px] bg-[var(--color-surface)] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
    >
      {/* Left: state indicator */}
      <div className="flex items-center gap-3">
        <span
          aria-label={`Pipeline state: ${status.state}`}
          className="flex items-center gap-2"
        >
          <span
            className="rounded-full w-2 h-2 flex-shrink-0"
            style={{ backgroundColor: stateColor }}
            aria-hidden="true"
          />
          <span
            className="text-[16px] font-semibold"
            style={{ color: stateColor }}
          >
            {status.state}
          </span>
        </span>
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-6 text-[14px] font-normal text-[var(--color-muted)]">
        <span>
          Active Runs:{' '}
          <span className="text-[var(--color-foreground)] font-semibold">
            {status.activeRuns}
          </span>
        </span>
        <span>
          Queue Depth:{' '}
          <span className="text-[var(--color-foreground)] font-semibold">
            {status.queueDepth}
          </span>
        </span>
        <span>
          Last sync:{' '}
          <span className="text-[var(--color-foreground)]">
            {formatLastSync(status.lastSyncAt)}
          </span>
        </span>
        <span>
          Processing rate:{' '}
          <span className="text-[var(--color-foreground)]">
            ~{status.processingRatePerMin}/min
          </span>
        </span>
      </div>
    </div>
  )
}

export { PipelineStatusSkeleton }
