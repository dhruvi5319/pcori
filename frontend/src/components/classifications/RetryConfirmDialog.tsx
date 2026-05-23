'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Loader2 } from 'lucide-react'
import { useRetryClassification } from '@/hooks/useRetryClassification'

interface RetryConfirmDialogProps {
  classificationId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RetryConfirmDialog({
  classificationId,
  open,
  onOpenChange,
}: RetryConfirmDialogProps) {
  const retry = useRetryClassification()

  const handleRetry = async () => {
    if (!classificationId) return
    await retry.mutateAsync(classificationId)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#141414] rounded-xl p-6 max-w-[400px] w-full
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)] focus:outline-none"
          aria-describedby="retry-dialog-description"
        >
          <Dialog.Title className="text-[24px] font-semibold mb-2 text-gray-900 dark:text-white">
            Retry this classification?
          </Dialog.Title>
          <p
            id="retry-dialog-description"
            className="text-[16px] text-gray-500 dark:text-gray-400 mb-6"
          >
            The classification will be re-submitted to the pipeline from the beginning.
          </p>

          {/* Per UI-SPEC: both buttons secondary (retry is NOT destructive) */}
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                disabled={retry.isPending}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                           disabled:opacity-50 transition-colors"
              >
                Don&apos;t Retry
              </button>
            </Dialog.Close>
            <button
              onClick={handleRetry}
              disabled={retry.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                         disabled:opacity-50 transition-colors"
            >
              {retry.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Retrying…
                </>
              ) : (
                'Retry Classification'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
