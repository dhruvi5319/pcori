'use client'

import { useState } from 'react'
import { Play, Square, Pause, RefreshCw } from 'lucide-react'
import { usePipelineControl } from '@/hooks/usePipeline'
import { StopConfirmDialog } from './StopConfirmDialog'
import { SyncConfirmDialog } from './SyncConfirmDialog'
import type { PipelineState } from '@/types/pipeline'
import { cn } from '@/lib/utils'

interface PipelineControlActionsProps {
  isAdmin: boolean
  pipelineState: PipelineState
  pipelineId?: string
}

// Per UI-SPEC §Control Button Visibility Rules
const BUTTON_ENABLED: Record<PipelineState, Record<string, boolean>> = {
  STOPPED:   { start: true,  stop: false, pause: false, resume: false, sync: true },
  RUNNING:   { start: false, stop: true,  pause: true,  resume: false, sync: true },
  PAUSED:    { start: false, stop: false, pause: false, resume: true,  sync: true },
  FAILED:    { start: true,  stop: false, pause: false, resume: false, sync: true },
  IDLE:      { start: true,  stop: false, pause: false, resume: false, sync: true },
  COMPLETED: { start: true,  stop: false, pause: false, resume: false, sync: true },
}

export function PipelineControlActions({
  isAdmin,
  pipelineState,
  pipelineId = 'default',
}: PipelineControlActionsProps) {
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

  const { mutate: control, isPending } = usePipelineControl()

  if (!isAdmin) return null

  const enabled = BUTTON_ENABLED[pipelineState] ?? BUTTON_ENABLED.IDLE

  const buttonClass = (isEnabled: boolean) =>
    cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-[14px] font-normal',
      'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]',
      'transition-colors',
      isEnabled
        ? 'hover:bg-[var(--color-surface-hover)] cursor-pointer'
        : 'opacity-50 cursor-not-allowed pointer-events-none'
    )

  const handleStart = () => control({ action: 'start', pipelineId })
  const handlePause = () => control({ action: 'pause', pipelineId })
  const handleResume = () => control({ action: 'resume', pipelineId })
  const handleStopConfirm = () => {
    setStopDialogOpen(false)
    control({ action: 'stop', pipelineId })
  }
  const handleSyncConfirm = () => {
    setSyncDialogOpen(false)
    control({ action: 'sync', pipelineId })
  }

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap" role="group" aria-label="Pipeline control actions">
        <button
          type="button"
          disabled={!enabled.start || isPending}
          className={buttonClass(enabled.start)}
          onClick={handleStart}
          aria-disabled={!enabled.start}
        >
          <Play size={16} aria-hidden="true" />
          Start Pipeline
        </button>

        <button
          type="button"
          disabled={!enabled.stop || isPending}
          className={buttonClass(enabled.stop)}
          onClick={() => setStopDialogOpen(true)}
          aria-disabled={!enabled.stop}
        >
          <Square size={16} aria-hidden="true" />
          Stop Pipeline
        </button>

        <button
          type="button"
          disabled={!enabled.pause || isPending}
          className={buttonClass(enabled.pause)}
          onClick={handlePause}
          aria-disabled={!enabled.pause}
        >
          <Pause size={16} aria-hidden="true" />
          Pause Pipeline
        </button>

        <button
          type="button"
          disabled={!enabled.resume || isPending}
          className={buttonClass(enabled.resume)}
          onClick={handleResume}
          aria-disabled={!enabled.resume}
        >
          <Play size={16} aria-hidden="true" />
          Resume Pipeline
        </button>

        <button
          type="button"
          disabled={!enabled.sync || isPending}
          className={buttonClass(enabled.sync)}
          onClick={() => setSyncDialogOpen(true)}
          aria-disabled={!enabled.sync}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Sync Now
        </button>
      </div>

      <StopConfirmDialog
        open={stopDialogOpen}
        onOpenChange={setStopDialogOpen}
        onConfirm={handleStopConfirm}
        isLoading={isPending}
      />

      <SyncConfirmDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        onConfirm={handleSyncConfirm}
        isLoading={isPending}
      />
    </>
  )
}
