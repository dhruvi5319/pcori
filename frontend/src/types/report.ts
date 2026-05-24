export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED'

export interface ExcelReport {
  id: string
  configurationId?: string
  status: ReportStatus
  generatedAt?: string
  filePath?: string
  errorMessage?: string
  createdAt: string
}

export interface ReportConfiguration {
  id: string
  name: string
  columns: string[]
  filtersJson: string
  createdAt: string
  updatedAt: string
}

export interface FilterConfiguration {
  id: string
  name: string
  criteriaJson: string
  createdAt: string
  updatedAt: string
}

export interface PreviewResponse {
  totalRows: number
  sampleRows: Record<string, unknown>[]
}

export interface CreateReportRequest {
  columns: string[]
  filtersJson?: string
  configurationId?: string
}

export interface CreateTemplateRequest {
  name: string
  columns: string[]
  filtersJson: string
}

export interface SaveFilterRequest {
  name: string
  criteriaJson: string
}
