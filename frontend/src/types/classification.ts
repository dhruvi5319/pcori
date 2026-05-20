export type ClassificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CLASSIFIED'
  | 'FAILED'
  | 'NEEDS_REVIEW'

export interface Classification {
  id: string
  planId: string
  title?: string
  status: ClassificationStatus
  pcc?: string
  taxonomyCategory?: string
  taxonomyCode?: string
  taxonomySubcode?: string
  primaryCondition?: string
  secondaryConditions?: string
  icdCodes?: string
  projectSummary?: string
  populationSetting?: string
  intervention?: string
  comparator?: string
  primaryOutcome?: string
  secondaryOutcomes?: string
  textPreview?: string
  extractionWarning?: string
  confidenceScore?: number
  modelVersion?: string
  processingTimeMs?: number
  fileId?: string
  fileName?: string
  fileSize?: number
  filePath?: string
  notes?: string
  uploadedBy: string
  uploadedAt: string
  classifiedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  overrideReason?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface ClassificationFilters {
  page?: number
  size?: number
  sort?: string
  status?: ClassificationStatus
  startDate?: string
  endDate?: string
  pcc?: string
  q?: string
}

export interface ClassificationStatistics {
  total: number
  classified: number
  processing: number
  pending: number
  failed: number
  needsReview: number
  avgConfidence: number
  overrideRate: number
}
