'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { usePipelineLogs } from '@/hooks/usePipeline'
import type { LogLevel, PipelineState } from '@/types/pipeline'
import { cn } from '@/lib/utils'

interface PipelineLogsPanelProps {
  runId: string
  pipelineState?: PipelineState
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  INFO:  'text-[#6B7280] dark:text-[#9CA3AF]',
  WARN:  'text-[#D97706] dark:text-[#F59E0B]',
  ERROR: 'text-[#DC2626] dark:text-[#EF4444] font-[600]',
}

const LOG_PANEL_ID = 'pipeline-logs-panel'

function formatLogTime(loggedAt: string): string {
  try {
    return new Date(loggedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return loggedAt
  }
}

export function PipelineLogsPanel({ runId, pipelineState }: PipelineLogsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data, isLoading, isError } = usePipelineLogs(runId, page, PAGE_SIZE, pipelineState)

  const panelHeight = expanded ? 480 : 240

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-semibold text-[var(--color-foreground)]">
          Event Log
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={LOG_PANEL_ID}
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-[14px] font-normal text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} aria-hidden="true" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown size={16} aria-hidden="true" />
              Expand
            </>
          )}
        </button>
      </div>

      {/* Log panel */}
      <div
        id={LOG_PANEL_ID}
        role="log"
        aria-label="Pipeline event log"
        className={cn(
          'overflow-y-auto rounded-[8px] bg-[var(--color-surface)] p-4',
          'border border-[var(--color-border)]',
          'transition-all duration-300 ease-in-out'
        )}
        style={{ height: panelHeight, fontFamily: 'var(--font-geist-mono)', fontSize: '14px' }}
      >
        {isLoading && (
          <div className="text-[var(--color-muted)]">Loading logs…</div>
        )}
        {isError && (
          <div className="text-[#DC2626] dark:text-[#EF4444]">
            Unable to load logs — retrying…
          </div>
        )}
        {!isLoading && !isError && data && data.content.length === 0 && (
          <div className="text-[var(--color-muted)]">No log entries for this run.</div>
        )}
        {!isLoading && !isError && data && data.content.map((entry) => (
          <div key={entry.id} className="flex gap-3 py-0.5">
            <span className="text-[var(--color-muted)] flex-shrink-0 w-20">
              {formatLogTime(entry.loggedAt)}
            </span>
            <span className={cn('flex-shrink-0 w-12', LOG_LEVEL_COLORS[entry.level])}>
              {entry.level}
            </span>
            <span className={cn(LOG_LEVEL_COLORS[entry.level], 'flex-1 break-all')}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[14px] font-normal text-[var(--color-muted)]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, data.totalPages - 1))}
            disabled={data.last}
            className="text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load more
          </button>
          <span>
            Page {data.page + 1} / {data.totalPages}
          </span>
        </div>
      )}
    </div>
  )
}
