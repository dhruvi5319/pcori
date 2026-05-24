import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { DashboardMetrics, DashboardConfiguration } from '@/types/dashboard'
import type { Classification, ClassificationFilters } from '@/types/classification'
import type { PagedResponse } from '@/types/api'

export const DASHBOARD_KEYS = {
  metrics: (startDate?: string, endDate?: string) =>
    ['dashboard', 'metrics', startDate, endDate] as const,
  configuration: () => ['dashboard', 'configuration'] as const,
  recentClassifications: () => ['dashboard', 'recentClassifications'] as const,
}

export function useDashboardMetrics(startDate?: string, endDate?: string) {
  return useQuery<DashboardMetrics>({
    queryKey: DASHBOARD_KEYS.metrics(startDate, endDate),
    queryFn: async () => {
      if (startDate && endDate) {
        return api
          .get<DashboardMetrics>('/api/dashboard/metrics/range', {
            params: { startDate, endDate },
          })
          .then((r) => r.data)
      }
      return api.get<DashboardMetrics>('/api/dashboard/metrics').then((r) => r.data)
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useDashboardConfiguration() {
  return useQuery<DashboardConfiguration>({
    queryKey: DASHBOARD_KEYS.configuration(),
    queryFn: () =>
      api.get<DashboardConfiguration>('/api/dashboard/configuration').then((r) => r.data),
    staleTime: Infinity,
  })
}

export function useSaveDashboardConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (layout: Record<string, unknown>) =>
      api
        .put<DashboardConfiguration>('/api/dashboard/configuration', { layout })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.configuration() })
      toast.success('Layout saved', {
        style: { background: '#16A34A', color: '#fff' },
      })
    },
  })
}

export function useDeleteDashboardConfiguration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/api/dashboard/configuration').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.configuration() })
      toast('Layout reset to default', {
        description: 'Your dashboard layout has been reset.',
      })
    },
  })
}

export function useRecentClassifications() {
  const filters: ClassificationFilters = { size: 10, sort: 'uploadedAt,desc' }
  return useQuery<PagedResponse<Classification>>({
    queryKey: DASHBOARD_KEYS.recentClassifications(),
    queryFn: () =>
      api
        .get<PagedResponse<Classification>>('/api/classifications', { params: filters })
        .then((r) => r.data),
    staleTime: 30_000,
  })
}
