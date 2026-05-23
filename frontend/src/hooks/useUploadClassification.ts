import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { CLASSIFICATION_KEYS } from './useClassifications'
import type { UploadResponse } from '@/types/classification'
import { toast } from 'sonner'

export function useUploadClassification() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      title,
      notes,
      onProgress,
    }: {
      file: File
      title?: string
      notes?: string
      onProgress: (pct: number) => void
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (title) formData.append('title', title)
      if (notes) formData.append('notes', notes)

      return api
        .post<UploadResponse>('/api/classifications/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              onProgress(Math.round((event.loaded / event.total) * 100))
            }
          },
        })
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      toast.success(`Plan ${data.planId} submitted — classification in progress`)
      qc.invalidateQueries({ queryKey: CLASSIFICATION_KEYS.all })
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number } }
      const msg =
        axiosError?.response?.status === 503
          ? 'Storage unavailable — please try again in a moment'
          : axiosError?.response?.status === 415
            ? 'Only PDF files are accepted'
            : 'Upload failed — please try again'
      toast.error(msg)
    },
  })
}
