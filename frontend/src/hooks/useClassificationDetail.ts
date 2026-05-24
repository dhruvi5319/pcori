import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { CLASSIFICATION_KEYS } from './useClassifications'
import type { Classification } from '@/types/classification'

export function useClassificationDetail(id: string | null) {
  return useQuery({
    queryKey: id ? CLASSIFICATION_KEYS.detail(id) : ['classifications', 'detail', '__none__'],
    queryFn: () =>
      api.get<Classification>(`/api/classifications/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const status = (query.state.data as Classification | undefined)?.status
      return status === 'PROCESSING' || status === 'PENDING' ? 5_000 : false
    },
  })
}
