import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { HelpArticle, Faq, FeedbackResponse } from '@/types/help'

export const HELP_KEYS = {
  all: ['help'] as const,
  articles: () => [...HELP_KEYS.all, 'articles'] as const,
  article: (slug: string) => [...HELP_KEYS.all, 'article', slug] as const,
  search: (q: string) => [...HELP_KEYS.all, 'search', q] as const,
  faqs: (category?: string) => [...HELP_KEYS.all, 'faqs', category ?? 'all'] as const,
  feedback: (articleId: string) => [...HELP_KEYS.all, 'feedback', articleId] as const,
}

export function useArticles() {
  return useQuery({
    queryKey: HELP_KEYS.articles(),
    queryFn: () => api.get<HelpArticle[]>('/api/help/articles').then((r) => r.data),
    staleTime: 300_000, // 5 min
  })
}

export function useArticle(slug: string | null) {
  return useQuery({
    queryKey: HELP_KEYS.article(slug ?? ''),
    queryFn: () => api.get<HelpArticle>(`/api/help/articles/${slug}`).then((r) => r.data),
    staleTime: 300_000,
    enabled: !!slug,
  })
}

export function useSearchArticles(q: string) {
  return useQuery({
    queryKey: HELP_KEYS.search(q),
    queryFn: () =>
      api
        .get<HelpArticle[]>('/api/help/articles/search', { params: { q } })
        .then((r) => r.data),
    enabled: q.length >= 2,
    staleTime: 0, // on-demand
  })
}

export function useFaqs(category?: string) {
  return useQuery({
    queryKey: HELP_KEYS.faqs(category),
    queryFn: () =>
      api
        .get<Faq[]>('/api/help/faqs', { params: category ? { category } : {} })
        .then((r) => r.data),
    staleTime: 300_000,
  })
}

export function useArticleFeedback(articleId: string | null) {
  return useQuery({
    queryKey: HELP_KEYS.feedback(articleId ?? ''),
    queryFn: () =>
      api.get<FeedbackResponse>(`/api/help/articles/${articleId}/feedback`).then((r) => r.data),
    enabled: !!articleId,
    staleTime: 60_000,
  })
}

export function useSubmitFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { articleId: string; helpful: boolean; comment?: string }) =>
      api.post<FeedbackResponse>('/api/help/feedback', payload).then((r) => r.data),
    onSuccess: (_, { articleId }) => {
      qc.invalidateQueries({ queryKey: HELP_KEYS.feedback(articleId) })
    },
    onError: (error: unknown) => {
      // 409 = duplicate submission — treat as success for UX (silently ignore)
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 409) {
        // No-op: caller handles "submitted" state
        return
      }
    },
  })
}
