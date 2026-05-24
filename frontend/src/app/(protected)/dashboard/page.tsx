'use client'

import { useState, useEffect } from 'react'
import { Settings2, Check, RotateCcw } from 'lucide-react'
import { KpiCardGrid } from '@/components/dashboard/KpiCardGrid'
import { StatusBreakdownRow } from '@/components/dashboard/StatusBreakdownRow'
import { UrgentActionBanner } from '@/components/dashboard/UrgentActionBanner'
import { QuickActionsRow } from '@/components/dashboard/QuickActionsRow'
import { RecentClassificationsFeed } from '@/components/dashboard/RecentClassificationsFeed'
import {
  useDashboardMetrics,
  useDashboardConfiguration,
  useSaveDashboardConfiguration,
  useDeleteDashboardConfiguration,
} from '@/hooks/useDashboard'
import { DEFAULT_KPI_WIDGETS } from '@/types/dashboard'
import type { KpiWidgetConfig } from '@/types/dashboard'
import { cn } from '@/lib/utils'

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardPage() {
  const [isCustomizeMode, setIsCustomizeMode] = useState(false)
  const [widgetOrder, setWidgetOrder] = useState<KpiWidgetConfig[]>(DEFAULT_KPI_WIDGETS)
  const [currentTime, setCurrentTime] = useState(formatCurrentTime())

  const { data: metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } = useDashboardMetrics()
  const { data: configuration } = useDashboardConfiguration()
  const saveMutation = useSaveDashboardConfiguration()
  const deleteMutation = useDeleteDashboardConfiguration()

  // Initialize widget order from saved configuration
  useEffect(() => {
    if (configuration?.layout) {
      const savedOrder = configuration.layout as { widgets?: KpiWidgetConfig[] }
      if (savedOrder.widgets && Array.isArray(savedOrder.widgets) && savedOrder.widgets.length > 0) {
        setWidgetOrder(savedOrder.widgets)
      }
    }
  }, [configuration])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatCurrentTime()), 60_000)
    return () => clearInterval(timer)
  }, [])

  function handleLayoutChange(newOrder: KpiWidgetConfig[]) {
    setWidgetOrder(newOrder)
    saveMutation.mutate({ widgets: newOrder })
  }

  function handleCustomizeDone() {
    setIsCustomizeMode(false)
    // Save final layout on Done
    saveMutation.mutate({ widgets: widgetOrder })
  }

  function handleResetToDefault() {
    setWidgetOrder(DEFAULT_KPI_WIDGETS)
    deleteMutation.mutate()
    setIsCustomizeMode(false)
  }

  const failed = metrics?.failed ?? 0
  const needsReview = metrics?.needsReview ?? 0
  const pending = metrics?.pending ?? 0

  return (
    <div className="space-y-6">
      {/* Page header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-[600] text-[var(--color-foreground)]">
            Dashboard
          </h1>
          <p className="text-[14px] font-[400] text-[var(--color-muted)] mt-0.5">
            Data current as of {currentTime}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isCustomizeMode && (
            <button
              onClick={handleResetToDefault}
              className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-foreground)] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Default
            </button>
          )}
          <button
            onClick={() => (isCustomizeMode ? handleCustomizeDone() : setIsCustomizeMode(true))}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[8px] text-[14px] font-[500] transition-all',
              'border border-[var(--color-border,rgba(0,0,0,0.12))]',
              'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.04))]',
              'text-[var(--color-foreground)]'
            )}
          >
            {isCustomizeMode ? (
              <>
                <Check className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <Settings2 className="h-4 w-4" />
                Customize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Zone 1: KPI Cards */}
      <KpiCardGrid
        widgets={widgetOrder}
        metrics={metricsError ? undefined : metrics}
        isLoading={metricsLoading}
        isCustomizeMode={isCustomizeMode}
        onLayoutChange={handleLayoutChange}
      />

      {/* Show error state if metrics failed */}
      {metricsError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              data-testid="kpi-card"
              className="rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)] bg-[var(--color-surface)] min-h-[120px] p-4 flex items-center justify-center gap-2"
            >
              <span className="text-[14px] text-[var(--color-muted)]">Unable to load</span>
              <button
                onClick={() => refetchMetrics()}
                aria-label="Retry loading"
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zone 2: Status Breakdown */}
      <StatusBreakdownRow
        pending={pending}
        failed={failed}
        needsReview={needsReview}
        isLoading={metricsLoading}
      />

      {/* Zone 3: Urgent Action Banner (conditional) */}
      {!metricsLoading && (failed > 0 || needsReview > 0) && (
        <UrgentActionBanner failed={failed} needsReview={needsReview} />
      )}

      {/* Zone 4: Quick Actions */}
      <QuickActionsRow />

      {/* Zone 5: Recent Classifications Feed */}
      <RecentClassificationsFeed />
    </div>
  )
}
