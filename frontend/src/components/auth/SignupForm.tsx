'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PasswordInput } from './PasswordInput'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'
import { useRegisterMutation } from '@/hooks/useAuthMutations'

const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, '3–50 characters, letters, numbers, and underscores only'),
  email: z.string().email('Invalid email address').max(255),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a digit'),
})
type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  })
  const registerMutation = useRegisterMutation()
  const [passwordFocused, setPasswordFocused] = useState(false)
  const passwordValue = watch('password', '')

  const onSubmit = (data: SignupFormData) => {
    registerMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="text-center">
        <h1 className="text-2xl font-semibold" style={{ lineHeight: '1.2' }}>
          Create your account
        </h1>
      </div>

      {/* Username */}
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium">Username *</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          aria-describedby="username-hint username-error"
          {...register('username')}
          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        />
        <p id="username-hint" className="text-xs" style={{ color: 'var(--color-muted)' }}>
          3–50 characters, letters, numbers, and underscores only
        </p>
        {errors.username && (
          <p id="username-error" className="text-xs text-red-600" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email *</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-600" role="alert">{errors.email.message}</p>
        )}
      </div>

      {/* First + Last name side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="firstName" className="text-sm font-medium">First Name *</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            {...register('firstName')}
            className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
          {errors.firstName && (
            <p className="text-xs text-red-600" role="alert">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="lastName" className="text-sm font-medium">Last Name *</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            {...register('lastName')}
            className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
          {errors.lastName && (
            <p className="text-xs text-red-600" role="alert">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Password with rules indicator */}
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password *</label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-describedby="password-rules"
          onFocus={() => setPasswordFocused(true)}
          {...register('password')}
        />
        {(passwordFocused || passwordValue) && (
          <div id="password-rules">
            <PasswordStrengthIndicator password={passwordValue} />
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-red-600" role="alert">{errors.password.message}</p>
        )}
      </div>

      {/* Create Account button */}
      <button
        type="submit"
        disabled={!isValid || registerMutation.isPending}
        className="w-full rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
        style={{ background: 'var(--gradient-cta)' }}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : 'Create Account'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="hover:underline font-medium"
              style={{ color: 'var(--color-accent)' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
