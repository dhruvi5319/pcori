'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type {
  PipelineStatusDto,
  PipelineStageDto,
  PipelineLogDto,
  PipelineRunDto,
  DbHealthDto,
  PipelineState,
} from '@/types/pipeline'
import type { PagedResponse } from '@/types/api'

export const PIPELINE_KEYS = {
  all: ['pipeline'] as const,
  status: () => [...PIPELINE_KEYS.all, 'status'] as const,
  health: () => [...PIPELINE_KEYS.all, 'health'] as const,
  stages: () => [...PIPELINE_KEYS.all, 'stages'] as const,
  logs: (runId: string, page: number, size: number) =>
    [...PIPELINE_KEYS.all, 'logs', runId, page, size] as const,
  history: (id: string, page: number) =>
    [...PIPELINE_KEYS.all, 'history', id, page] as const,
  connections: () => [...PIPELINE_KEYS.all, 'connections'] as const,
}

export interface PipelineFullStatus {
  status: PipelineStatusDto;
  stages: PipelineStageDto[];
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: PIPELINE_KEYS.status(),
    queryFn: () =>
      api
        .get<PipelineFullStatus>('/api/pipeline/status')
        .then((r) => r.data),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data as PipelineFullStatus | undefined
      return data?.status?.state === 'RUNNING' ? 10_000 : false
    },
  })
}

export function usePipelineHealth() {
  return useQuery({
    queryKey: PIPELINE_KEYS.health(),
    queryFn: () =>
      api.get<PipelineFullStatus>('/api/pipeline/health').then((r) => r.data),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data as PipelineFullStatus | undefined
      return data?.status?.state === 'RUNNING' ? 10_000 : false
    },
  })
}

export function usePipelineLogs(
  runId: string,
  page: number,
  size: number,
  pipelineState?: PipelineState
) {
  return useQuery({
    queryKey: PIPELINE_KEYS.logs(runId, page, size),
    queryFn: () =>
      api
        .get<PagedResponse<PipelineLogDto>>(`/api/pipeline/${runId}/logs`, {
          params: { page, size },
        })
        .then((r) => r.data),
    staleTime: 15_000,
    enabled: !!runId,
    refetchInterval: pipelineState === 'RUNNING' ? 15_000 : false,
  })
}

export function usePipelineHistory(id: string, page: number) {
  return useQuery({
    queryKey: PIPELINE_KEYS.history(id, page),
    queryFn: () =>
      api
        .get<PagedResponse<PipelineRunDto>>(`/api/pipeline/${id}/history`, {
          params: { page },
        })
        .then((r) => r.data),
    staleTime: 30_000,
    enabled: !!id,
  })
}

export function useDbHealth() {
  return useQuery({
    queryKey: PIPELINE_KEYS.connections(),
    queryFn: () =>
      api.get<DbHealthDto>('/api/pipeline/connections').then((r) => r.data),
    staleTime: 30_000,
  })
}

export type PipelineAction =
  | 'start'
  | 'stop'
  | 'pause'
  | 'resume'
  | 'sync'
  | 'retry'

export interface PipelineControlPayload {
  action: PipelineAction
  pipelineId?: string
  stageName?: string
}

const ACTION_TOAST_MESSAGES: Record<PipelineAction, { loading: string; success: string; error: string }> = {
  start:   { loading: 'Starting pipeline…', success: 'Pipeline started', error: 'Failed to start pipeline' },
  stop:    { loading: 'Stopping pipeline…', success: 'Pipeline stopping — in-flight stage will complete', error: 'Failed to stop pipeline' },
  pause:   { loading: 'Pausing pipeline…', success: 'Pipeline paused', error: 'Failed to pause pipeline' },
  resume:  { loading: 'Resuming pipeline…', success: 'Pipeline resumed', error: 'Failed to resume pipeline' },
  sync:    { loading: 'Triggering sync…', success: 'Sync triggered — pending records queued', error: 'Failed to trigger sync' },
  retry:   { loading: 'Retrying stage…', success: 'Stage requeued for processing', error: 'Failed to retry stage' },
}

export function usePipelineControl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, pipelineId, stageName }: PipelineControlPayload) => {
      const id = pipelineId ?? 'default'
      if (action === 'retry' && stageName) {
        return api
          .post(`/api/pipeline/${id}/stages/${stageName}/retry`)
          .then((r) => r.data)
      }
      return api.post(`/api/pipeline/${id}/${action}`).then((r) => r.data)
    },
    onMutate: ({ action }) => {
      toast.loading(ACTION_TOAST_MESSAGES[action].loading, { id: `pipeline-${action}` })
    },
    onSuccess: (_data, { action }) => {
      toast.success(ACTION_TOAST_MESSAGES[action].success, { id: `pipeline-${action}` })
      queryClient.invalidateQueries({ queryKey: PIPELINE_KEYS.status() })
      queryClient.invalidateQueries({ queryKey: PIPELINE_KEYS.health() })
    },
    onError: (_err, { action }) => {
      toast.error(ACTION_TOAST_MESSAGES[action].error, { id: `pipeline-${action}` })
    },
  })
}
