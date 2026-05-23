import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { TaxonomyTreeNode, TaxonomyCategory, CreateTaxonomyRequest, UpdateTaxonomyRequest } from '@/types/taxonomy'
import { toast } from 'sonner'

export const TAXONOMY_KEYS = {
  all: ['taxonomy'] as const,
  tree: () => [...TAXONOMY_KEYS.all, 'tree'] as const,
  active: () => [...TAXONOMY_KEYS.all, 'active'] as const,
  search: (q: string) => [...TAXONOMY_KEYS.all, 'search', q] as const,
  detail: (id: string) => [...TAXONOMY_KEYS.all, 'detail', id] as const,
}

export function useTaxonomyTree() {
  return useQuery({
    queryKey: TAXONOMY_KEYS.tree(),
    queryFn: () => api.get<TaxonomyTreeNode[]>('/api/taxonomy/tree').then(r => r.data),
    staleTime: 60_000,   // taxonomy is static data — 60s per UI-SPEC
  })
}

export function useTaxonomySearch(q: string) {
  return useQuery({
    queryKey: TAXONOMY_KEYS.search(q),
    queryFn: () => api.get<TaxonomyCategory[]>('/api/taxonomy/search', { params: { q } }).then(r => r.data),
    enabled: q.length > 0,
    staleTime: 10_000,
  })
}

export function useCreateTaxonomy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaxonomyRequest) => api.post<TaxonomyCategory>('/api/taxonomy', data).then(r => r.data),
    onSuccess: () => { toast.success('Category added'); qc.invalidateQueries({ queryKey: TAXONOMY_KEYS.all }) },
    onError: (e: any) => {
      const msg = e.response?.data?.detail ?? 'Failed to create category'
      toast.error(msg)
    }
  })
}

export function useUpdateTaxonomy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxonomyRequest }) =>
      api.put<TaxonomyCategory>(`/api/taxonomy/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('Category updated'); qc.invalidateQueries({ queryKey: TAXONOMY_KEYS.all }) },
    onError: () => toast.error('Update failed — please try again'),
  })
}

export function useSetTaxonomyStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<TaxonomyCategory>(`/api/taxonomy/${id}/status`, { isActive }).then(r => r.data),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Code activated' : 'Code deactivated')
      qc.invalidateQueries({ queryKey: TAXONOMY_KEYS.all })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Status update failed'),
  })
}
