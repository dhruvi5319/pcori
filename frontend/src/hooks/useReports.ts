import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  ExcelReport,
  ReportConfiguration,
  FilterConfiguration,
  PreviewResponse,
  CreateReportRequest,
  CreateTemplateRequest,
  SaveFilterRequest,
} from '@/types/report'

export const REPORT_KEYS = {
  all: ['reports'] as const,
  list: () => [...REPORT_KEYS.all, 'list'] as const,
  templates: () => [...REPORT_KEYS.all, 'templates'] as const,
  template: (id: string) => [...REPORT_KEYS.templates(), id] as const,
  filters: () => [...REPORT_KEYS.all, 'filters'] as const,
  preview: () => [...REPORT_KEYS.all, 'preview'] as const,
  download: (id: string) => [...REPORT_KEYS.all, 'download', id] as const,
}

/** List of ExcelReports; polls every 5s when any row has status === 'GENERATING' */
export function useReports() {
  return useQuery({
    queryKey: REPORT_KEYS.list(),
    queryFn: () =>
      api.get<ExcelReport[]>('/api/reports').then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data as ExcelReport[] | undefined
      return data?.some((r) => r.status === 'GENERATING') ? 5_000 : false
    },
  })
}

/** List of ReportConfiguration templates; no polling */
export function useReportTemplates() {
  return useQuery({
    queryKey: REPORT_KEYS.templates(),
    queryFn: () =>
      api.get<ReportConfiguration[]>('/api/reports/templates').then((r) => r.data),
    staleTime: 60_000,
  })
}

/** List of FilterConfiguration; no polling */
export function useFilters() {
  return useQuery({
    queryKey: REPORT_KEYS.filters(),
    queryFn: () =>
      api.get<FilterConfiguration[]>('/api/filters').then((r) => r.data),
    staleTime: 60_000,
  })
}

/** POST /api/excel/generate — creates a new report */
export function useCreateReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateReportRequest) =>
      api.post<ExcelReport>('/api/excel/generate', req).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.list() })
    },
  })
}

/** POST /api/reports — saves a named template */
export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateTemplateRequest) =>
      api.post<ReportConfiguration>('/api/reports', req).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() })
    },
  })
}

/** PUT /api/reports/templates/{id} — updates an existing template */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: Partial<CreateTemplateRequest> }) =>
      api.put<ReportConfiguration>(`/api/reports/templates/${id}`, req).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() })
    },
  })
}

/** DELETE /api/reports/templates/{id} */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/reports/templates/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() })
    },
  })
}

/** POST /api/reports/templates/{id}/run — runs a saved template */
export function useRunTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ExcelReport>(`/api/reports/templates/${id}/run`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.list() })
    },
  })
}

/** POST /api/filters — saves a filter configuration */
export function useSaveFilter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: SaveFilterRequest) =>
      api.post<FilterConfiguration>('/api/filters', req).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.filters() })
    },
  })
}

/** Preview query — fetches report preview on demand (not cached) */
export function useReportPreview(params: CreateReportRequest | null) {
  return useQuery({
    queryKey: [...REPORT_KEYS.preview(), params],
    queryFn: () =>
      api.get<PreviewResponse>('/api/reports/preview', { params }).then((r) => r.data),
    enabled: false, // enabled manually by refetch()
    staleTime: 0,
  })
}

/** Download a specific report — disabled by default, enabled on demand */
export function useDownloadReport(id: string | null) {
  return useQuery({
    queryKey: id ? REPORT_KEYS.download(id) : ['reports', 'download', 'none'],
    queryFn: async () => {
      const response = await api.get(`/api/reports/${id}/download`, {
        responseType: 'blob',
      })
      return response.data as Blob
    },
    enabled: false,
    staleTime: 0,
  })
}
