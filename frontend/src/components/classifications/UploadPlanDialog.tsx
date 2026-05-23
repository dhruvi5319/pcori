'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PdfDropzone } from './PdfDropzone'
import { UploadProgressBar } from './UploadProgressBar'
import { useUploadClassification } from '@/hooks/useUploadClassification'

interface UploadPlanDialogProps { open: boolean; onOpenChange: (open: boolean) => void }

type UploadFormData = { title: string; notes: string }

export function UploadPlanDialog({ open, onOpenChange }: UploadPlanDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)

  const { register, handleSubmit, reset } = useForm<UploadFormData>()
  const upload = useUploadClassification()

  const handleFileSelect = (file: File | null) => {
    setFileError(null)
    if (file && !file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      setFileError('Only PDF files are accepted')
      setSelectedFile(null)
      return
    }
    if (file && file.size > 50 * 1024 * 1024) {
      setFileError('File exceeds the 50MB limit')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }

  const onSubmit = async (formData: UploadFormData) => {
    if (!selectedFile) return
    setShowProgress(true)
    setUploadProgress(0)
    try {
      await upload.mutateAsync({
        file: selectedFile,
        title: formData.title || undefined,
        notes: formData.notes || undefined,
        onProgress: setUploadProgress,
      })
      onOpenChange(false)
      reset()
      setSelectedFile(null)
      setShowProgress(false)
    } catch {
      setShowProgress(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Content
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   bg-white dark:bg-[#141414] rounded-xl p-6 w-full max-w-[640px]
                   shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]"
        aria-label="Upload Research Plan dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Dialog.Title className="text-[24px] font-semibold">Upload Research Plan</Dialog.Title>
          <Dialog.Close asChild>
            <button aria-label="Close dialog" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* PDF Dropzone */}
          <PdfDropzone onFileSelect={handleFileSelect} selectedFile={selectedFile} error={fileError} />

          {/* Title field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="upload-title" className="text-[16px]">Title (optional)</label>
            <input id="upload-title" type="text" maxLength={255}
              {...register('title')}
              placeholder="Defaults to filename if left blank"
              className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[16px]" />
          </div>

          {/* Notes field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="upload-notes" className="text-[16px]">Notes (optional)</label>
            <textarea id="upload-notes" maxLength={2000} rows={3}
              {...register('notes')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[16px] resize-none" />
          </div>

          {/* Progress bar — shown only during upload per UI-SPEC */}
          {showProgress && <UploadProgressBar progress={uploadProgress} />}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close asChild>
              <button type="button" className="px-4 py-2 rounded-lg border border-gray-200 text-[16px] hover:bg-gray-50">
                Discard
              </button>
            </Dialog.Close>
            <button
              type="submit"
              disabled={!selectedFile || upload.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                         bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:enabled:brightness-110 transition-all"
            >
              {upload.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload Plan</>
              )}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
