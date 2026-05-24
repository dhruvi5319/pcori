'use client'

import * as Dialog from '@radix-ui/react-dialog'
import * as Separator from '@radix-ui/react-separator'
import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useOverrideClassification } from '@/hooks/useOverrideClassification'
import type { Classification } from '@/types/classification'

const overrideSchema = z.object({
  pcc: z.string().optional(),
  taxonomyCategory: z.string().optional(),
  taxonomyCode: z.string().optional(),
  taxonomySubcode: z.string().optional(),
  overrideReason: z.string().min(1, 'Override reason is required').max(2000),
})

type OverrideFormValues = z.infer<typeof overrideSchema>

interface ManualOverrideDialogProps {
  classification: Classification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FIELD_CONFIG = [
  { label: 'PCC', field: 'pcc' as const, currentFn: (c: Classification) => c.pcc },
  {
    label: 'Taxonomy Category',
    field: 'taxonomyCategory' as const,
    currentFn: (c: Classification) => c.taxonomyCategory,
  },
  {
    label: 'Taxonomy Code',
    field: 'taxonomyCode' as const,
    currentFn: (c: Classification) => c.taxonomyCode,
  },
  {
    label: 'Taxonomy Subcode',
    field: 'taxonomySubcode' as const,
    currentFn: (c: Classification) => c.taxonomySubcode,
  },
]

export function ManualOverrideDialog({
  classification: c,
  open,
  onOpenChange,
}: ManualOverrideDialogProps) {
  const override = useOverrideClassification()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      pcc: '',
      taxonomyCategory: '',
      taxonomyCode: '',
      taxonomySubcode: '',
      overrideReason: '',
    },
  })

  const watchedReason = watch('overrideReason') ?? ''
  const reasonLen = watchedReason.length

  const isFieldChanged = (field: keyof OverrideFormValues, currentValue: string | undefined) => {
    const watched = watch(field)
    return watched && watched.trim() !== '' && watched !== (currentValue ?? '')
  }

  const onSubmit = async (data: OverrideFormValues) => {
    if (!c) return
    await override.mutateAsync({ id: c.id, data })
    onOpenChange(false)
    reset()
  }

  const handleClose = () => {
    if (!override.isPending) {
      onOpenChange(false)
      reset()
    }
  }

  if (!c) return null

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#141414] rounded-xl w-full max-w-[800px] max-h-[90vh]
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col
                     focus:outline-none"
          aria-describedby="override-dialog-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Override Classification: {c.planId}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                disabled={override.isPending}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p id="override-dialog-description" className="sr-only">
            Override the AI taxonomy classification for {c.planId}. Provide corrected values and a
            required reason.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {/* Split pane */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left pane — read-only AI values */}
              <div
                className="w-[48%] p-6 bg-[#F9FAFB] dark:bg-[#111111] overflow-y-auto"
                aria-label="Current AI Classification (read-only)"
              >
                <h3 className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Current AI Classification
                </h3>
                {FIELD_CONFIG.map(({ label, field, currentFn }) => {
                  const currentValue = currentFn(c)
                  const changed = isFieldChanged(field, currentValue)
                  return (
                    <div key={field} className="mb-4">
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">{label}</p>
                      {/* Strikethrough when right-pane changed — UI-SPEC §Visual diff highlight */}
                      <p
                        className={`text-[16px] ${
                          changed
                            ? 'line-through text-gray-400 dark:text-gray-600'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {currentValue ?? '—'}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Radix Separator */}
              <Separator.Root
                orientation="vertical"
                className="w-px bg-[#E5E7EB] dark:bg-[#2A2A2A]"
              />

              {/* Right pane — editable fields */}
              <div
                className="w-[48%] p-6 overflow-y-auto"
                aria-label="Override values"
              >
                <h3 className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Your Override
                </h3>
                {FIELD_CONFIG.map(({ label, field, currentFn }) => {
                  const currentValue = currentFn(c)
                  const changed = isFieldChanged(field, currentValue)
                  return (
                    <div
                      key={field}
                      className={`mb-4 pl-2 ${changed ? 'border-l-2 border-amber-400' : ''}`}
                    >
                      <label
                        htmlFor={`override-${field}`}
                        className="text-[14px] text-gray-500 dark:text-gray-400"
                      >
                        {label}
                      </label>
                      <input
                        id={`override-${field}`}
                        type="text"
                        {...register(field)}
                        placeholder={`Select ${label}`}
                        className={`w-full h-9 px-3 mt-1 rounded-lg border border-gray-200 dark:border-gray-700
                                   bg-white dark:bg-gray-900 text-[16px]
                                   focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                                   ${changed ? 'text-[#1D4ED8] dark:text-[#3B82F6]' : 'text-gray-900 dark:text-gray-100'}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Override Reason — full width below panes */}
            <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="override-reason"
                  className="text-[16px] font-medium text-gray-900 dark:text-white"
                >
                  Override Reason <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="override-reason"
                    rows={3}
                    {...register('overrideReason')}
                    aria-required="true"
                    aria-describedby="override-reason-error"
                    placeholder="Explain why this classification needs correction... (1–2000 characters)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-[16px] text-gray-900 dark:text-gray-100
                               resize-none focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                               transition-shadow"
                    style={{ minHeight: '96px', maxHeight: '200px' }}
                  />
                  {/* Character counter */}
                  <span className="absolute bottom-2 right-2 text-[12px] text-gray-400">
                    {reasonLen}/2000
                  </span>
                </div>
                {errors.overrideReason && (
                  <p
                    id="override-reason-error"
                    className="text-[14px] text-[#DC2626]"
                    role="alert"
                  >
                    {errors.overrideReason.message}
                  </p>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={override.isPending}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                               disabled:opacity-50 transition-colors"
                  >
                    Keep AI Classification
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={reasonLen === 0 || override.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                             bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:enabled:brightness-110 transition-all"
                >
                  {override.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Saving override…
                    </>
                  ) : (
                    'Submit Override'
                  )}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
