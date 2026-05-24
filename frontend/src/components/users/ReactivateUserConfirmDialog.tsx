'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useToggleUserStatus } from '@/hooks/useUsers'
import type { User } from '@/types/user'

interface ReactivateUserConfirmDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReactivateUserConfirmDialog({
  user,
  open,
  onOpenChange,
}: ReactivateUserConfirmDialogProps) {
  const toggleStatus = useToggleUserStatus()

  const handleReactivate = () => {
    if (!user) return

    toggleStatus.mutate(
      { id: user.id, active: true, username: user.username },
      {
        onSuccess: () => {
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
          aria-describedby="reactivate-user-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Reactivate {user.username}?
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

          {/* Body */}
          <p
            id="reactivate-user-description"
            className="text-[16px] text-gray-600 dark:text-gray-400 mb-6"
          >
            This will restore{' '}
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {user.username}
            </span>
            &apos;s access to the platform.
          </p>

          {/* Actions — both secondary (reactivation is recoverable, NOT destructive) */}
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                Keep Inactive
              </button>
            </Dialog.Close>

            {/* Secondary outline — NOT red, NOT gradient (recoverable action) */}
            <button
              onClick={handleReactivate}
              disabled={toggleStatus.isPending}
              className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                         transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              {toggleStatus.isPending ? 'Reactivating…' : 'Reactivate User'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
