export type UserRole = 'REVIEWER' | 'MANAGER' | 'TAXONOMY_ADMIN' | 'ADMIN' | 'VIEWER'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  isActive: boolean
  isEmailVerified: boolean
  roles: UserRole[]
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    username: string
    roles: UserRole[]
  }
}

export interface RegisterRequest {
  username: string   // 3–50 chars; alphanumeric + underscore
  email: string      // RFC 5322
  password: string   // 8–128 chars; complexity rules
  firstName: string
  lastName: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
