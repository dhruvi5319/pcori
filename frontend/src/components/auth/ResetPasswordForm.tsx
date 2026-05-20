'use client'

import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PasswordInput } from './PasswordInput'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { useResetPasswordMutation } from '@/hooks/useAuthMutations'
import { useState } from 'react'

const resetSchema = z.object({
  newPassword: z.string()
    .min(8).max(128)
    .regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
  })
  const mutation = useResetPasswordMutation()
  const [tokenError, setTokenError] = useState(false)
  const newPasswordValue = watch('newPassword', '')

  if (!token || tokenError) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-600">
          This reset link has expired or has already been used.
        </p>
        <Link href="/forgot-password" className="text-sm underline" style={{ color: 'var(--color-accent)' }}>
          Request new reset link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit((data) => {
      mutation.mutate({ token, newPassword: data.newPassword }, {
        onError: () => setTokenError(true),
      })
    })} className="space-y-4" noValidate>
      <h1 className="text-2xl font-semibold text-center">Set new password</h1>

      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
        <PasswordInput id="newPassword" autoComplete="new-password" {...register('newPassword')} />
        <PasswordStrengthIndicator password={newPasswordValue} />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          {...register('confirmPassword')}
          aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
        />
        {errors.confirmPassword?.message && (
          <p id="confirm-error" className="text-xs text-red-600" role="alert">
            {String(errors.confirmPassword.message)}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || mutation.isPending}
        className="w-full rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        style={{ background: 'var(--gradient-cta)' }}
      >
        {mutation.isPending ? (
          <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Updating password…</>
        ) : 'Reset Password'}
      </button>
    </form>
  )
}
