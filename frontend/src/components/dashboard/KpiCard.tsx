'use client'

import { GripVertical, AlertCircle, RotateCcw } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface SparklinePoint {
  value: number
}

interface KpiCardProps {
  id?: string
  label: string
  value: number | string
  sparklineData?: SparklinePoint[]
  sparklineColor?: string
  delta?: string
  isCustomizeMode?: boolean
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  dragHandleProps?: Record<string, unknown>
  dragStyle?: React.CSSProperties
  className?: string
}

function formatValue(value: number | string, label: string): string {
  if (typeof value === 'string') return value
  if (label === 'Avg AI Confidence') {
    return `${(value * 100).toFixed(1)}%`
  }
  return value.toLocaleString()
}

export function KpiCard({
  label,
  value,
  sparklineData,
  sparklineColor = '#2563EB',
  delta,
  isCustomizeMode = false,
  isError = false,
  onRetry,
  dragHandleProps,
  dragStyle,
  className,
}: KpiCardProps) {
  if (isError) {
    return (
      <div
        data-testid="kpi-card"
        className={cn(
          'rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
          'bg-[var(--color-surface)] min-h-[120px] p-4',
          'flex items-center justify-center gap-2',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-[var(--color-muted)]" />
        <span className="text-[14px] text-[var(--color-muted)]">Unable to load</span>
        {onRetry && (
          <button
            onClick={onRetry}
            aria-label="Retry loading"
            className="ml-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      data-testid="kpi-card"
      style={dragStyle}
      className={cn(
        'rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
        'bg-[var(--color-surface)] min-h-[120px] p-4',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]',
        'transition-all duration-200',
        'flex flex-col gap-1',
        className
      )}
    >
      {/* Drag handle — top-left, visible in customize mode */}
      <div
        {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
        className={cn(
          'w-6 h-10 flex items-center text-[var(--color-muted)] transition-opacity duration-150',
          isCustomizeMode ? 'opacity-100 cursor-grab active:cursor-grabbing' : 'opacity-40',
          'self-start -ml-1 -mt-1'
        )}
        aria-label={`Drag to reorder ${label} card`}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Main content row: number + sparkline */}
      <div className="flex items-start justify-between gap-2 -mt-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[48px] font-[600] leading-none text-[var(--color-foreground)]">
            {formatValue(value as number, label)}
          </span>
          <span className="text-[14px] font-[400] text-[var(--color-muted)]">{label}</span>
          {delta && (
            <span
              className={cn(
                'text-[14px] font-[400]',
                delta.startsWith('+') ? 'text-[#16A34A]' : delta.startsWith('-') ? 'text-[#DC2626]' : 'text-[var(--color-muted)]'
              )}
            >
              {delta}
            </span>
          )}
        </div>

        {/* Sparkline — 80×40px */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="shrink-0" style={{ width: 80, height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
