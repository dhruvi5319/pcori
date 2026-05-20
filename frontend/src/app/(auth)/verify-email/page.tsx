'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import api from '@/lib/api'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setState('error'); return }
    api.get(`/api/auth/verify-email?token=${token}`)
      .then(() => setState('success'))
      .catch(() => setState('error'))
  }, [token])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Verifying your email…</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle size={48} style={{ color: '#16A34A' }} aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Email verified!</h1>
        <Link
          href="/login"
          className="rounded-lg px-4 py-2.5 text-white font-medium text-sm min-h-[44px] inline-flex items-center"
          style={{ background: 'var(--gradient-cta)' }}
        >
          Log In Now
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <XCircle size={48} className="text-red-600" aria-hidden="true" />
      <p className="text-sm">This verification link has expired or was already used.</p>
      <Link href="/login" className="text-sm underline" style={{ color: 'var(--color-accent)' }}>
        Request new verification email
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </AuthCard>
  )
}
