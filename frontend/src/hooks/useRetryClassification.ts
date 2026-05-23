import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { CLASSIFICATION_KEYS } from './useClassifications'
import { toast } from 'sonner'

export function useRetryClassification() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/classifications/${id}/retry`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Classification requeued')
      qc.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number } }
      const msg =
        axiosError?.response?.status === 400
          ? 'Only failed classifications can be retried'
          : 'Retry failed — please try again'
      toast.error(msg)
    },
  })
}
