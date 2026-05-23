import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Classification, ClassificationFilters } from '@/types/classification'
import type { PagedResponse } from '@/types/api'

export const CLASSIFICATION_KEYS = {
  all: ['classifications'] as const,
  list: (f: ClassificationFilters) => [...CLASSIFICATION_KEYS.all, 'list', f] as const,
  detail: (id: string) => [...CLASSIFICATION_KEYS.all, 'detail', id] as const,
}

export function useClassifications(filters: ClassificationFilters) {
  return useQuery({
    queryKey: CLASSIFICATION_KEYS.list(filters),
    queryFn: () => api.get<PagedResponse<Classification>>('/api/classifications', { params: filters }).then(r => r.data),
    staleTime: 10_000,  // 10s per UI-SPEC TanStack polling table
    refetchInterval: (query) => {
      const data = query.state.data as PagedResponse<Classification> | undefined
      return data?.content.some(c => c.status === 'PROCESSING') ? 5_000 : false
    },
  })
}
