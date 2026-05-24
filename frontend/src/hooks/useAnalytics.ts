import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  AccuracyTrendPoint,
  CategoryAccuracyDto,
  ConfidenceDistributionDto,
  ProcessingVolumePoint,
  RecentOverrideDto,
  ModelPerformanceDto,
} from '@/types/analytics';
import type { PagedResponse } from '@/types/api';

export const ANALYTICS_KEYS = {
  all: ['analytics'] as const,
  accuracyTrend: (startDate: string, endDate: string, granularity: string) =>
    [...ANALYTICS_KEYS.all, 'accuracy-trend', startDate, endDate, granularity] as const,
  categoryAccuracy: (startDate: string, endDate: string) =>
    [...ANALYTICS_KEYS.all, 'category-accuracy', startDate, endDate] as const,
  confidenceDistribution: (startDate: string, endDate: string) =>
    [...ANALYTICS_KEYS.all, 'confidence-distribution', startDate, endDate] as const,
  processingVolume: (startDate: string, endDate: string, granularity: string) =>
    [...ANALYTICS_KEYS.all, 'processing-volume', startDate, endDate, granularity] as const,
  recentOverrides: (page: number, size: number) =>
    [...ANALYTICS_KEYS.all, 'overrides', page, size] as const,
  modelPerformance: (startDate: string, endDate: string) =>
    [...ANALYTICS_KEYS.all, 'model-performance', startDate, endDate] as const,
};

export function useAccuracyTrend(
  startDate: string,
  endDate: string,
  granularity: string = 'day'
) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.accuracyTrend(startDate, endDate, granularity),
    queryFn: () =>
      api
        .get<AccuracyTrendPoint[]>('/api/analytics/accuracy-trend', {
          params: { startDate, endDate, granularity },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useCategoryAccuracy(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.categoryAccuracy(startDate, endDate),
    queryFn: () =>
      api
        .get<CategoryAccuracyDto[]>('/api/analytics/category-accuracy', {
          params: { startDate, endDate },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useConfidenceDistribution(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.confidenceDistribution(startDate, endDate),
    queryFn: () =>
      api
        .get<ConfidenceDistributionDto[]>('/api/analytics/confidence-distribution', {
          params: { startDate, endDate },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useProcessingVolume(
  startDate: string,
  endDate: string,
  granularity: string = 'day'
) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.processingVolume(startDate, endDate, granularity),
    queryFn: () =>
      api
        .get<ProcessingVolumePoint[]>('/api/analytics/processing-volume', {
          params: { startDate, endDate, granularity },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useRecentOverrides(page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.recentOverrides(page, size),
    queryFn: () =>
      api
        .get<PagedResponse<RecentOverrideDto>>('/api/analytics/overrides', {
          params: { page, size },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useModelPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.modelPerformance(startDate, endDate),
    queryFn: () =>
      api
        .get<ModelPerformanceDto>('/api/analytics/model-performance', {
          params: { startDate, endDate },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });
}
