'use client'

import * as Dialog from '@radix-ui/react-dialog'

interface StopConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading?: boolean
}

export function StopConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: StopConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-[12px] bg-[var(--color-background)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.18),0_4px_8px_rgba(0,0,0,0.12)]"
        >
          <Dialog.Title className="text-[24px] font-semibold text-[var(--color-foreground)] mb-2">
            Stop the pipeline?
          </Dialog.Title>
          <Dialog.Description className="text-[16px] font-normal text-[var(--color-muted)] mb-6">
            The in-flight stage will complete before stopping.
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                autoFocus
                className="inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-[14px] font-normal border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                Keep Pipeline Running
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 rounded-[6px] text-[14px] font-normal bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Stopping…' : 'Stop Pipeline'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
