'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PdfDropzone } from './PdfDropzone'
import { UploadProgressBar } from './UploadProgressBar'
import { useUploadClassification } from '@/hooks/useUploadClassification'

interface UploadFormValues {
  title: string
  notes: string
}

interface UploadPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadPlanDialog({ open, onOpenChange }: UploadPlanDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)

  const { register, handleSubmit, reset } = useForm<UploadFormValues>()
  const upload = useUploadClassification()

  const handleFileSelect = (file: File | null) => {
    setFileError(null)
    if (!file) {
      setSelectedFile(null)
      return
    }
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Only PDF files are accepted')
      setSelectedFile(null)
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setFileError('File exceeds the 50MB limit')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }

  const handleClose = () => {
    if (!upload.isPending) {
      onOpenChange(false)
      reset()
      setSelectedFile(null)
      setFileError(null)
      setShowProgress(false)
      setUploadProgress(0)
    }
  }

  const onSubmit = async (formData: UploadFormValues) => {
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
      handleClose()
    } catch {
      // Error already handled via toast in the mutation
      setShowProgress(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#141414] rounded-xl p-6 w-full max-w-[640px]
                     shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]
                     focus:outline-none"
          aria-describedby="upload-dialog-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Upload Research Plan
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                disabled={upload.isPending}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p id="upload-dialog-description" className="sr-only">
            Upload a PDF research plan for automated PCORI taxonomy classification
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* PDF Dropzone */}
            <PdfDropzone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              error={fileError}
            />

            {/* Title field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="upload-title" className="text-[16px] text-gray-700 dark:text-gray-200">
                Title <span className="text-gray-400 text-[14px]">(optional)</span>
              </label>
              <input
                id="upload-title"
                type="text"
                maxLength={255}
                {...register('title')}
                placeholder="Defaults to filename if left blank"
                className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-[16px] text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition-shadow"
              />
            </div>

            {/* Notes field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="upload-notes" className="text-[16px] text-gray-700 dark:text-gray-200">
                Notes <span className="text-gray-400 text-[14px]">(optional)</span>
              </label>
              <textarea
                id="upload-notes"
                maxLength={2000}
                rows={3}
                {...register('notes')}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-[16px] text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none transition-shadow"
              />
            </div>

            {/* Progress bar — shown only during upload */}
            {showProgress && <UploadProgressBar progress={uploadProgress} />}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={upload.isPending}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                           disabled:opacity-50 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={!selectedFile || upload.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:enabled:brightness-110 hover:enabled:-translate-y-0.5
                           transition-all duration-150"
              >
                {upload.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    Upload Plan
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
