'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useSaveFilter } from '@/hooks/useReports'

const schema = z.object({
  name: z.string().min(1, 'Filter name is required'),
})

type FormData = z.infer<typeof schema>

interface SaveFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteriaJson: string
}

export function SaveFilterDialog({ open, onOpenChange, criteriaJson }: SaveFilterDialogProps) {
  const saveFilter = useSaveFilter()
  const [duplicateError, setDuplicateError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  const onSubmit = (data: FormData) => {
    setDuplicateError('')
    saveFilter.mutate(
      { name: data.name, criteriaJson },
      {
        onSuccess: () => {
          toast.success(`Filter saved as '${data.name}'`)
          reset()
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          const axiosError = error as { response?: { status: number } }
          if (axiosError.response?.status === 409) {
            setDuplicateError('A filter with this name already exists')
          } else {
            toast.error('Failed to save filter — please try again')
          }
        },
      }
    )
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      reset()
      setDuplicateError('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-[400px] p-6"
          aria-describedby="save-filter-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Save Filter
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          <p id="save-filter-description" className="sr-only">
            Save your current filter configuration with a name for future use.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Filter Name field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-name"
                className="text-[16px] text-gray-700 dark:text-gray-300"
              >
                Filter Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="filter-name"
                {...register('name')}
                placeholder="e.g. Q2 Active Plans"
                aria-describedby={errors.name || duplicateError ? 'filter-name-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
              {(errors.name || duplicateError) && (
                <span
                  id="filter-name-error"
                  className="text-[14px] text-[#DC2626]"
                  role="alert"
                >
                  {errors.name?.message || duplicateError}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                             transition-colors"
                >
                  Don&apos;t Save
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!isValid || saveFilter.isPending}
                className="px-4 py-2 text-[16px] rounded-lg text-white
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           hover:brightness-110 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveFilter.isPending ? 'Saving…' : 'Save Filter'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
