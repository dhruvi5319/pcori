export interface AccuracyTrendPoint {
  bucket: string;
  aiAccuracy: number;
  humanCorrectedAccuracy: number;
  total: number;
}

export interface CategoryAccuracyDto {
  category: string;
  total: number;
  overrideCount: number;
  overrideRate: number;
}

export interface ConfidenceDistributionDto {
  bucket: string;
  low: number;
  high: number;
  count: number;
}

export interface ProcessingVolumePoint {
  bucket: string;
  count: number;
}

export interface RecentOverrideDto {
  classificationId: string;
  planId: string;
  reviewerUsername: string;
  originalCategory: string;
  overrideCategory: string;
  overrideReason: string;
  reviewedAt: string;
}

export interface ModelPerformanceDto {
  precision: number;
  recall: number;
  f1Score: number;
  totalEvaluated: number;
}
