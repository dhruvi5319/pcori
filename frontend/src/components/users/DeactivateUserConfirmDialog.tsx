'use client'

import { useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useToggleUserStatus } from '@/hooks/useUsers'
import type { User } from '@/types/user'

interface DeactivateUserConfirmDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateUserConfirmDialog({
  user,
  open,
  onOpenChange,
}: DeactivateUserConfirmDialogProps) {
  const toggleStatus = useToggleUserStatus()
  const dismissRef = useRef<HTMLButtonElement>(null)

  const handleDeactivate = () => {
    if (!user) return

    toggleStatus.mutate(
      { id: user.id, active: false, username: user.username },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: () => {
          // Toast is already shown by the hook; just close the dialog
          onOpenChange(false)
        },
      }
    )
  }

  if (!user) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-[400px] p-6"
          aria-describedby="deactivate-user-description"
          onOpenAutoFocus={(e) => {
            // Auto-focus the dismiss button (safer default for destructive action)
            e.preventDefault()
            dismissRef.current?.focus()
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Deactivate {user.firstName} {user.lastName}?
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

          {/* Body copy — explicit consequences */}
          <p
            id="deactivate-user-description"
            className="text-[16px] text-gray-600 dark:text-gray-400 mb-6"
          >
            This will deactivate{' '}
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {user.username}
            </span>
            &apos;s account. They will no longer be able to log in. All their classifications and
            data remain intact.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {/* Dismiss button — auto-focused (safer default for destructive action) */}
            <Dialog.Close asChild>
              <button
                ref={dismissRef}
                className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                Keep Active
              </button>
            </Dialog.Close>

            {/* Destructive confirm button — bg-[#DC2626] per UI-SPEC, NOT gradient */}
            <button
              onClick={handleDeactivate}
              disabled={toggleStatus.isPending}
              className="px-4 py-2 text-[16px] rounded-lg text-white
                         bg-[#DC2626] hover:bg-[#B91C1C]
                         transition-colors duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:ring-offset-2"
            >
              {toggleStatus.isPending ? 'Deactivating…' : 'Deactivate User'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
