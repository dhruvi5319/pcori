'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useForgotPasswordMutation } from '@/hooks/useAuthMutations'

const forgotSchema = z.object({ email: z.string().email() })

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { isValid } } = useForm({
    resolver: zodResolver(forgotSchema),
    mode: 'onChange',
  })
  const mutation = useForgotPasswordMutation()
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {/* UI-SPEC: "If an account with that email exists, a reset link has been sent. Check your inbox." */}
          If an account with that email exists, a reset link has been sent. Check your inbox.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] leading-[44px]"
          style={{ background: 'var(--gradient-cta)' }}
        >
          Return to Login
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((data) => {
        mutation.mutate(data.email)
        setSubmitted(true)
      })}
      className="space-y-4"
      noValidate
    >
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || mutation.isPending}
        className="w-full rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        style={{ background: 'var(--gradient-cta)' }}
      >
        {mutation.isPending ? (
          <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</>
        ) : 'Send Reset Link'}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-sm" style={{ color: 'var(--color-accent)' }}>
          ← Back to login
        </Link>
      </div>
    </form>
  )
}
