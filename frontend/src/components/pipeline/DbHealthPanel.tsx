'use client'

import type { DbHealthDto } from '@/types/pipeline'

interface DbHealthPanelProps {
  health: DbHealthDto
}

export function DbHealthPanel({ health }: DbHealthPanelProps) {
  return (
    <div className="rounded-[8px] bg-[var(--color-surface)] px-6 py-4 border border-[var(--color-border)]">
      <div className="flex items-center gap-6 text-[16px] font-normal text-[var(--color-muted)] flex-wrap">
        <span>
          <span className="font-semibold text-[var(--color-foreground)]">Connections:</span>{' '}
          Active{' '}
          <span className="text-[var(--color-foreground)]">{health.activeConnections}</span>
          {' / '}Max{' '}
          <span className="text-[var(--color-foreground)]">{health.maxConnections}</span>
        </span>
        <span className="text-[var(--color-border)]">|</span>
        <span>
          Idle:{' '}
          <span className="text-[var(--color-foreground)]">{health.idleConnections}</span>
        </span>
        <span className="text-[var(--color-border)]">|</span>
        <span>
          Queue Depth:{' '}
          <span className="text-[var(--color-foreground)]">{health.queueDepth}</span>
        </span>
      </div>
    </div>
  )
}
