import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Classification, ClassificationFilters, ManualOverrideRequest, UploadResponse } from '@/types/classification'
import type { PagedResponse } from '@/types/api'

export const CLASSIFICATION_KEYS = {
  all: ['classifications'] as const,
  list: (f: ClassificationFilters) => [...CLASSIFICATION_KEYS.all, 'list', f] as const,
  detail: (id: string) => [...CLASSIFICATION_KEYS.all, 'detail', id] as const,
  statistics: () => [...CLASSIFICATION_KEYS.all, 'statistics'] as const,
}

export function useClassifications(filters: ClassificationFilters) {
  return useQuery({
    queryKey: CLASSIFICATION_KEYS.list(filters),
    queryFn: () =>
      api
        .get<PagedResponse<Classification>>('/api/classifications', { params: filters })
        .then((r) => r.data),
    staleTime: 10_000, // 10s stale time
    refetchInterval: (query) => {
      const data = query.state.data as PagedResponse<Classification> | undefined
      // Poll every 5s only when at least one row is still PROCESSING
      return data?.content.some((c) => c.status === 'PROCESSING') ? 5_000 : false
    },
  })
}

export function useClassification(id: string | null) {
  return useQuery({
    queryKey: id ? CLASSIFICATION_KEYS.detail(id) : ['classifications', 'detail', 'none'],
    queryFn: () =>
      api.get<Classification>(`/api/classifications/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 10_000,
  })
}

export function useUploadClassification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      api
        .post<UploadResponse>('/api/classifications/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
  })
}

export function useManualOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ManualOverrideRequest }) =>
      api.put<Classification>(`/api/classifications/${id}/override`, req).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
  })
}

export function useRetryClassification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Classification>(`/api/classifications/${id}/retry`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
  })
}
