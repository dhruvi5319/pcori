import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { User, UserRole } from '@/types/user'

export interface UserFilters {
  q?: string
  role?: UserRole | ''
  status?: 'active' | 'inactive' | ''
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  roles: UserRole[]
}

export interface UpdateUserRequest {
  firstName: string
  lastName: string
  phoneNumber?: string
  roles: UserRole[]
}

export interface ToggleUserStatusRequest {
  id: string
  active: boolean
  username: string
}

export const USER_KEYS = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...USER_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...USER_KEYS.all, 'detail', id] as const,
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: USER_KEYS.list(filters),
    queryFn: () => {
      if (filters.q) {
        return api
          .get<User[]>('/api/users/search', {
            params: {
              q: filters.q || undefined,
              role: filters.role || undefined,
              status: filters.status || undefined,
            },
          })
          .then((r) => r.data)
      }
      return api
        .get<User[]>('/api/users', {
          params: {
            role: filters.role || undefined,
            status: filters.status || undefined,
          },
        })
        .then((r) => r.data)
    },
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateUserRequest) =>
      api.post<User>('/api/users', req).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
      toast.success(`Account created — verification email sent to ${data.email}`)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateUserRequest }) =>
      api.put<User>(`/api/users/${id}`, req).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
      toast.success('User updated')
    },
    onError: () => {
      toast.error('Failed to save changes — please try again')
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean; username: string }) =>
      api.patch<User>(`/api/users/${id}/status`, { active }).then((r) => r.data),
    onSuccess: (_data, { active, username }) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
      if (active) {
        toast.success(`${username} reactivated`)
      } else {
        toast.warning(`${username} deactivated`)
      }
    },
    onError: (error: unknown, _variables) => {
      const axiosError = error as { response?: { status: number; data?: { detail?: string } } }
      if (axiosError.response?.status === 400) {
        const detail =
          axiosError.response.data?.detail ?? 'You cannot deactivate your own account'
        toast.error(detail)
      } else {
        toast.error('Failed to update user status — please try again')
      }
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all })
      toast('User deleted', { style: { color: '#6B7280' } })
    },
  })
}
