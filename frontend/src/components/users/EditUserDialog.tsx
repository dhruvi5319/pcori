'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { useUpdateUser } from '@/hooks/useUsers'
import { RoleCheckboxGroup } from './RoleCheckboxGroup'
import type { User, UserRole } from '@/types/user'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
})

type FormData = z.infer<typeof schema>

interface EditUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roles: [],
    },
  })

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber ?? '',
        roles: user.roles,
      })
    }
  }, [user, reset])

  const onSubmit = (data: FormData) => {
    if (!user) return

    updateUser.mutate(
      {
        id: user.id,
        req: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || undefined,
          roles: data.roles as UserRole[],
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      reset()
    }
    onOpenChange(open)
  }

  if (!user) return null

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-[560px]
                     max-h-[90vh] overflow-y-auto p-6"
          aria-describedby="edit-user-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Edit User
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

          <p id="edit-user-description" className="sr-only">
            Edit user information and roles.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Read-only: Username */}
            <div className="flex flex-col gap-1">
              <span className="text-[16px] text-gray-700 dark:text-gray-300">Username</span>
              <div className="px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800
                              bg-gray-50 dark:bg-[#0F0F0F] text-[16px] text-gray-500 dark:text-gray-500
                              font-mono">
                {user.username}
              </div>
            </div>

            {/* Read-only: Email */}
            <div className="flex flex-col gap-1">
              <span className="text-[16px] text-gray-700 dark:text-gray-300">Email</span>
              <div className="px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800
                              bg-gray-50 dark:bg-[#0F0F0F] text-[16px] text-gray-500 dark:text-gray-500">
                {user.email}
              </div>
            </div>

            {/* Editable: First Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-first-name" className="text-[16px] text-gray-700 dark:text-gray-300">
                First Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="edit-first-name"
                {...register('firstName')}
                aria-describedby={errors.firstName ? 'edit-first-name-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              {errors.firstName && (
                <span id="edit-first-name-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Editable: Last Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-last-name" className="text-[16px] text-gray-700 dark:text-gray-300">
                Last Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="edit-last-name"
                {...register('lastName')}
                aria-describedby={errors.lastName ? 'edit-last-name-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
              {errors.lastName && (
                <span id="edit-last-name-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            {/* Editable: Phone Number */}
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-phone" className="text-[16px] text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                id="edit-phone"
                type="tel"
                {...register('phoneNumber')}
                placeholder="e.g. +1 (555) 123-4567"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
            </div>

            {/* Editable: Roles */}
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <RoleCheckboxGroup
                  value={field.value as UserRole[]}
                  onChange={field.onChange}
                  error={errors.roles?.message}
                />
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                             transition-colors"
                >
                  Discard Changes
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!isValid || !isDirty || updateUser.isPending}
                className="px-4 py-2 text-[16px] rounded-lg text-white
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           hover:brightness-110 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateUser.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
