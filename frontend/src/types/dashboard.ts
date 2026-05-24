export interface DashboardMetrics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number
}

export interface DashboardConfiguration {
  id: string
  userId: string
  layout: Record<string, unknown>
  widgets: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface KpiWidgetConfig {
  id: string
  label: string
  valueKey: keyof DashboardMetrics
  sparklineColor: string
}

// Default widget order — matches UI-SPEC sparkline color table
export const DEFAULT_KPI_WIDGETS: KpiWidgetConfig[] = [
  { id: 'total',      label: 'Total Plans',      valueKey: 'total',        sparklineColor: '#2563EB' },
  { id: 'classified', label: 'Classified',        valueKey: 'classified',   sparklineColor: '#16A34A' },
  { id: 'processing', label: 'Processing',        valueKey: 'processing',   sparklineColor: '#2563EB' },
  { id: 'avgConf',    label: 'Avg AI Confidence', valueKey: 'avgConfidence', sparklineColor: '#7C3AED' },
]
