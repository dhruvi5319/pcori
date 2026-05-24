import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { CLASSIFICATION_KEYS } from './useClassifications'
import type { Classification, ManualOverrideRequest } from '@/types/classification'
import { toast } from 'sonner'

export function useOverrideClassification() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ManualOverrideRequest }) =>
      api.put<Classification>(`/api/classifications/${id}/override`, data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Override saved successfully')
      qc.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
      qc.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.detail(data.id) })
    },
    onError: () => {
      toast.error('Override failed — please try again')
    },
  })
}
