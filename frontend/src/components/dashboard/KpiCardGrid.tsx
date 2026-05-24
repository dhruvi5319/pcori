'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { KpiCard } from './KpiCard'
import { KpiCardSkeleton } from './KpiCardSkeleton'
import type { KpiWidgetConfig, DashboardMetrics } from '@/types/dashboard'

interface SortableKpiCardProps {
  widget: KpiWidgetConfig
  metrics: DashboardMetrics
  isCustomizeMode: boolean
}

function SortableKpiCard({ widget, metrics, isCustomizeMode }: SortableKpiCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Build mock sparkline data based on current metric value
  const baseValue = metrics[widget.valueKey] as number
  const sparklineData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, baseValue + Math.round((Math.random() - 0.5) * (baseValue * 0.2)) - (6 - i) * Math.round(baseValue * 0.02)),
  }))

  return (
    <div ref={setNodeRef} style={style}>
      <KpiCard
        id={widget.id}
        label={widget.label}
        value={metrics[widget.valueKey] as number}
        sparklineData={sparklineData}
        sparklineColor={widget.sparklineColor}
        isCustomizeMode={isCustomizeMode}
        dragHandleProps={isCustomizeMode ? { ...attributes, ...listeners } : {}}
      />
    </div>
  )
}

interface KpiCardGridProps {
  widgets: KpiWidgetConfig[]
  metrics: DashboardMetrics | undefined
  isLoading: boolean
  isCustomizeMode: boolean
  onLayoutChange: (newOrder: KpiWidgetConfig[]) => void
}

export function KpiCardGrid({
  widgets,
  metrics,
  isLoading,
  isCustomizeMode,
  onLayoutChange,
}: KpiCardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    const newOrder = arrayMove(widgets, oldIndex, newIndex)
    onLayoutChange(newOrder)
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={horizontalListSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgets.map((widget) => (
            <SortableKpiCard
              key={widget.id}
              widget={widget}
              metrics={metrics}
              isCustomizeMode={isCustomizeMode}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay — ghost card */}
      <DragOverlay>
        {activeWidget && metrics ? (
          <div
            className="kpi-drag-ghost rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.20)] min-h-[120px] p-4"
            style={{ opacity: 0.6, transform: 'scale(1.02)', border: '2px dashed #1D4ED8' }}
          >
            <KpiCard
              label={activeWidget.label}
              value={metrics[activeWidget.valueKey] as number}
              sparklineColor={activeWidget.sparklineColor}
              isCustomizeMode={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
