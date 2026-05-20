'use client'

import { useCallback } from 'react'
import { UserRole } from '@/types/user'

interface JwtPayload {
  sub: string           // user UUID
  username: string
  roles: UserRole[]
  exp: number           // expiry timestamp (seconds)
  iat: number
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

export function useAuth() {
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('jwt_token')
  }, [])

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('jwt_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }, [])

  const clearTokens = useCallback(() => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('refresh_token')
  }, [])

  const getClaims = useCallback((): JwtPayload | null => {
    const token = getToken()
    if (!token) return null
    return parseJwt(token)
  }, [getToken])

  const isAuthenticated = useCallback((): boolean => {
    const claims = getClaims()
    if (!claims) return false
    return claims.exp * 1000 > Date.now()
  }, [getClaims])

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      const claims = getClaims()
      return claims?.roles?.includes(role) ?? false
    },
    [getClaims]
  )

  return { getToken, setTokens, clearTokens, getClaims, isAuthenticated, hasRole }
}
