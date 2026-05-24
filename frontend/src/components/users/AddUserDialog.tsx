'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Eye, EyeOff } from 'lucide-react'
import { useCreateUser } from '@/hooks/useUsers'
import { RoleCheckboxGroup } from './RoleCheckboxGroup'
import type { UserRole } from '@/types/user'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
})

type FormData = z.infer<typeof schema>

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const createUser = useCreateUser()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      roles: [],
    },
  })

  const onSubmit = (data: FormData) => {
    createUser.mutate(
      {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        roles: data.roles as UserRole[],
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          const axiosError = error as {
            response?: { status: number; data?: { detail?: string; field?: string } }
          }
          if (axiosError.response?.status === 409) {
            const detail = axiosError.response.data?.detail ?? ''
            if (detail.toLowerCase().includes('username') || detail.toLowerCase().includes('username')) {
              setError('username', { message: 'This username is already in use' })
            } else if (detail.toLowerCase().includes('email')) {
              setError('email', { message: 'This email address is already registered' })
            } else {
              setError('username', { message: 'This username is already in use' })
            }
          }
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

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-[560px]
                     max-h-[90vh] overflow-y-auto p-6"
          aria-describedby="add-user-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Add User
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

          <p id="add-user-description" className="sr-only">
            Create a new user account with roles and permissions.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-username" className="text-[16px] text-gray-700 dark:text-gray-300">
                Username <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="add-username"
                {...register('username')}
                placeholder="e.g. jsmith"
                aria-describedby={errors.username ? 'add-username-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
              {errors.username && (
                <span id="add-username-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-email" className="text-[16px] text-gray-700 dark:text-gray-300">
                Email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="add-email"
                type="email"
                {...register('email')}
                placeholder="e.g. j.smith@pcori.org"
                aria-describedby={errors.email ? 'add-email-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
              {errors.email && (
                <span id="add-email-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-password" className="text-[16px] text-gray-700 dark:text-gray-300">
                Password <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'add-password-error' : undefined}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                             placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                             focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span id="add-password-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-first-name" className="text-[16px] text-gray-700 dark:text-gray-300">
                First Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="add-first-name"
                {...register('firstName')}
                placeholder="e.g. Jane"
                aria-describedby={errors.firstName ? 'add-first-name-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
              {errors.firstName && (
                <span id="add-first-name-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-last-name" className="text-[16px] text-gray-700 dark:text-gray-300">
                Last Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="add-last-name"
                {...register('lastName')}
                placeholder="e.g. Smith"
                aria-describedby={errors.lastName ? 'add-last-name-error' : undefined}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
              {errors.lastName && (
                <span id="add-last-name-error" className="text-[14px] text-[#DC2626]" role="alert">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            {/* Phone Number (optional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="add-phone" className="text-[16px] text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                id="add-phone"
                type="tel"
                {...register('phoneNumber')}
                placeholder="e.g. +1 (555) 123-4567"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-[#141414] text-[16px] text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]
                           placeholder:text-gray-400"
              />
            </div>

            {/* Roles */}
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
                disabled={!isValid || createUser.isPending}
                className="px-4 py-2 text-[16px] rounded-lg text-white
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           hover:brightness-110 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createUser.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
