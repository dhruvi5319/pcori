'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PasswordInput } from './PasswordInput'
import { useLoginMutation } from '@/hooks/useAuthMutations'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })
  const loginMutation = useLoginMutation()

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Card title — UI-SPEC: "Sign In to PCORI Analytics" */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold" style={{ lineHeight: '1.2' }}>
          Sign In to PCORI Analytics
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Enter your credentials to continue
        </p>
      </div>

      {/* Username field */}
      <div className="space-y-1">
        <label htmlFor="username" className="text-sm font-medium">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          aria-describedby={errors.username ? 'username-error' : undefined}
          {...register('username')}
          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        />
        {errors.username && (
          <p id="username-error" className="text-xs text-red-600" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Sign In button — full-width gradient; disabled until both fields non-empty */}
      <button
        type="submit"
        disabled={!isValid || loginMutation.isPending}
        className="w-full rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
        style={{ background: 'var(--gradient-cta)' }}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : 'Sign In'}
      </button>

      {/* Forgot password link — right-aligned, Label 14px */}
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Forgot password?
        </Link>
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="hover:underline font-medium"
              style={{ color: 'var(--color-accent)' }}>
          Sign up
        </Link>
      </p>
    </form>
  )
}
