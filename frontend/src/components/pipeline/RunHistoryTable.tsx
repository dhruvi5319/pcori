'use client'

import type { PipelineRunDto } from '@/types/pipeline'
import { PIPELINE_STATE_COLORS } from '@/types/pipeline'
import type { PipelineState } from '@/types/pipeline'
import { cn } from '@/lib/utils'

interface RunHistoryTableProps {
  runs: PipelineRunDto[]
  isLoading?: boolean
}

function truncateId(id: string): string {
  if (id.length <= 8) return id
  return `${id.slice(0, 8)}…`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function StatusCell({ status }: { status: string }) {
  const color = PIPELINE_STATE_COLORS[status as PipelineState] ?? '#6B7280'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="rounded-full w-2 h-2 flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-[14px] font-normal" style={{ color }}>
        {status}
      </span>
    </span>
  )
}

export function RunHistoryTable({ runs, isLoading = false }: RunHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 rounded-[6px] skeleton-shimmer" />
        ))}
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="py-8 text-center text-[14px] font-normal text-[var(--color-muted)]">
        No pipeline runs yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px] font-normal">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
            <th className="text-left py-2 pr-4 font-normal">Run ID</th>
            <th className="text-left py-2 pr-4 font-normal">Started</th>
            <th className="text-left py-2 pr-4 font-normal">Completed</th>
            <th className="text-left py-2 pr-4 font-normal">Status</th>
            <th className="text-right py-2 pr-4 font-normal">Processed</th>
            <th className="text-right py-2 font-normal">Failed</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              className={cn(
                'border-b border-[var(--color-border)] text-[var(--color-foreground)]',
                'hover:bg-[var(--color-surface-hover)] transition-colors'
              )}
            >
              <td className="py-3 pr-4 font-mono font-semibold">
                {truncateId(run.id)}
              </td>
              <td className="py-3 pr-4">{formatDate(run.startedAt)}</td>
              <td className="py-3 pr-4">{formatDate(run.completedAt)}</td>
              <td className="py-3 pr-4">
                <StatusCell status={run.status} />
              </td>
              <td className="py-3 pr-4 text-right">{run.recordsProcessed.toLocaleString()}</td>
              <td className="py-3 text-right text-[#DC2626] dark:text-[#EF4444]">
                {run.failedCount > 0 ? run.failedCount.toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
