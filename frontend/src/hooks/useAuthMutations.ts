'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { LoginResponse, RegisterRequest, LoginRequest } from '@/types/user'
import type { ErrorResponse } from '@/types/api'
import axios from 'axios'

// FR-1.2: Login
export function useLoginMutation() {
  const { setTokens } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>('/api/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
      queryClient.clear()
      router.push('/dashboard')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const detail: string = error.response?.data?.detail ?? ''

        if (status === 401) {
          toast.error('Invalid username or password.')
        } else if (status === 403 && detail.includes('locked')) {
          const mins = detail.match(/(\d+) minute/)?.[1] ?? '30'
          toast.error(`Account locked. Try again after ${mins} minutes.`)
        } else if (status === 403 && detail.includes('EMAIL_NOT_VERIFIED')) {
          toast.error('Verify your email first.', {
            action: {
              label: 'Resend verification email',
              onClick: () => { /* resend logic — future enhancement */ },
            },
          })
        } else if (status === 403 && detail.includes('ACCOUNT_INACTIVE')) {
          toast.error('This account has been deactivated. Contact your administrator.')
        } else {
          toast.error('Connection error — please check your network and try again.')
        }
      }
    },
  })
}

// FR-1.1: Register
export function useRegisterMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post('/api/auth/register', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Account created — check your email to verify')
      router.push('/login')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const detail: string = error.response?.data?.detail ?? ''
        if (detail.includes('USERNAME_TAKEN')) {
          toast.error('Username already in use.')
        } else if (detail.includes('EMAIL_TAKEN')) {
          toast.error('Email already registered.')
        } else {
          toast.error('Registration failed. Please try again.')
        }
      }
    },
  })
}

// FR-1.4: Forgot password
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post('/api/auth/forgot-password', { email }).then(r => r.data),
    // No onError toast — always show success to prevent email enumeration
  })
}

// FR-1.4: Reset password
export function useResetPasswordMutation() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) =>
      api.post('/api/auth/reset-password', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Password updated. You can now sign in.')
      router.push('/login')
    },
    onError: (error) => {
      // Token errors handled inline in the form
      if (axios.isAxiosError(error) && error.response?.status !== 400) {
        toast.error('Connection error — please check your network and try again.')
      }
    },
  })
}

// Suppress unused import warning
type _ErrorResponse = ErrorResponse
