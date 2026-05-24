'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStatus, useDbHealth, usePipelineControl, usePipelineHistory } from '@/hooks/usePipeline'
import { PipelineStatusHeader, PipelineStatusSkeleton } from '@/components/pipeline/PipelineStatusHeader'
import { StageCardsRow } from '@/components/pipeline/StageCardsRow'
import { PipelineControlActions } from '@/components/pipeline/PipelineControlActions'
import { PipelineLogsPanel } from '@/components/pipeline/PipelineLogsPanel'
import { RunHistoryTable } from '@/components/pipeline/RunHistoryTable'
import { DbHealthPanel } from '@/components/pipeline/DbHealthPanel'
import { StageRetryConfirmDialog } from '@/components/pipeline/StageRetryConfirmDialog'
import { cn } from '@/lib/utils'

function PipelinePageSkeleton() {
  return (
    <div className="space-y-4">
      {/* Status header skeleton */}
      <PipelineStatusSkeleton />
      {/* Stage cards skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-[8px] skeleton-shimmer"
          />
        ))}
      </div>
    </div>
  )
}

export default function DataPipelinePage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')

  const {
    data: pipelineData,
    isLoading: statusLoading,
    isError: statusError,
  } = usePipelineStatus()

  const { data: dbHealth } = useDbHealth()

  const { mutate: control, isPending: controlPending } = usePipelineControl()

  // Stage retry dialog state
  const [retryStage, setRetryStage] = useState<string | null>(null)

  const status = pipelineData?.status
  const stages = pipelineData?.stages ?? []

  // Derive the latest run ID for logs (first stage's last run or fallback)
  const latestRunId = stages[0]?.lastRunAt ? 'latest' : ''

  // Check if any stage has stuck records
  const hasStuckRecords = stages.some((s) => s.stuckCount > 0)
  const totalStuckCount = stages.reduce((sum, s) => sum + s.stuckCount, 0)

  // Run history — use 'default' pipeline ID for history listing
  const { data: historyData, isLoading: historyLoading } = usePipelineHistory('default', 0)

  const handleRetryStage = (stageName: string) => {
    setRetryStage(stageName)
  }

  const handleRetryConfirm = () => {
    if (retryStage) {
      control({ action: 'retry', pipelineId: 'default', stageName: retryStage })
      setRetryStage(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Zone 1: Page header */}
      <h1 className="text-[24px] font-semibold text-[var(--color-foreground)]">
        Data Pipeline
      </h1>

      {/* Zone 2: Pipeline status header */}
      {statusLoading && <PipelinePageSkeleton />}

      {statusError && !statusLoading && (
        <div
          className={cn(
            'w-full h-20 px-6 flex items-center rounded-[8px]',
            'bg-[var(--color-surface)] border border-[var(--color-border)]',
            'text-[16px] font-normal text-[var(--color-muted)]'
          )}
        >
          Unable to connect to pipeline — retrying…
        </div>
      )}

      {!statusLoading && !statusError && status && (
        <>
          <PipelineStatusHeader status={status} />

          {/* Zone 3: Stuck records warning (conditional) */}
          {hasStuckRecords && (
            <div
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-[8px]',
                'bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.12)]',
                'border border-[#D97706]'
              )}
            >
              <AlertTriangle
                size={16}
                className="text-[#D97706] flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-[14px] font-normal text-[#D97706]">
                {totalStuckCount} record(s) stuck in PROCESSING beyond 15 minutes across stages
              </span>
            </div>
          )}

          {/* Zone 4: Admin control actions */}
          <PipelineControlActions
            isAdmin={isAdmin}
            pipelineState={status.state}
            pipelineId="default"
          />

          {/* Zone 5: Stage cards */}
          <StageCardsRow stages={stages} onRetryStage={handleRetryStage} />
        </>
      )}

      {/* Zone 6: DB Health panel */}
      {dbHealth && (
        <DbHealthPanel health={dbHealth} />
      )}

      {/* Zone 7: Tabs — Event Log + Run History */}
      <Tabs.Root defaultValue="event-log">
        <Tabs.List
          className="flex items-center border-b border-[var(--color-border)] mb-4"
          aria-label="Pipeline data tabs"
        >
          <Tabs.Trigger
            value="event-log"
            className={cn(
              'px-4 py-2 text-[14px] font-normal text-[var(--color-muted)]',
              'border-b-2 border-transparent -mb-px',
              'hover:text-[var(--color-foreground)] transition-colors',
              'data-[state=active]:border-[var(--color-accent)] data-[state=active]:text-[var(--color-foreground)]'
            )}
          >
            Event Log
          </Tabs.Trigger>
          <Tabs.Trigger
            value="run-history"
            className={cn(
              'px-4 py-2 text-[14px] font-normal text-[var(--color-muted)]',
              'border-b-2 border-transparent -mb-px',
              'hover:text-[var(--color-foreground)] transition-colors',
              'data-[state=active]:border-[var(--color-accent)] data-[state=active]:text-[var(--color-foreground)]'
            )}
          >
            Run History
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="event-log">
          <PipelineLogsPanel
            runId={latestRunId || 'latest'}
            pipelineState={status?.state}
          />
        </Tabs.Content>

        <Tabs.Content value="run-history">
          <RunHistoryTable
            runs={historyData?.content ?? []}
            isLoading={historyLoading}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Stage retry confirmation dialog */}
      {retryStage && (
        <StageRetryConfirmDialog
          open={!!retryStage}
          onOpenChange={(open) => { if (!open) setRetryStage(null) }}
          onConfirm={handleRetryConfirm}
          stageName={retryStage}
          isLoading={controlPending}
        />
      )}
    </div>
  )
}
