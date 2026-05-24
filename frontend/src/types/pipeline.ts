export type PipelineState = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'FAILED' | 'IDLE' | 'COMPLETED';
export type StageState = 'RUNNING' | 'IDLE' | 'FAILED' | 'PAUSED' | 'COMPLETED';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface PipelineStatusDto {
  state: PipelineState;
  activeRuns: number;
  queueDepth: number;
  lastSyncAt: string | null;
  processingRatePerMin: number;
}

export interface PipelineStageDto {
  name: string;       // 'EXTRACT' | 'CLASSIFY' | 'PERSIST'
  state: StageState;
  lastRunAt: string | null;
  lastDurationMs: number;
  stuckCount: number;
  errorMessage: string | null;
}

export interface PipelineLogDto {
  id: string;
  runId: string;
  level: LogLevel;
  message: string;
  loggedAt: string;
}

export interface PipelineRunDto {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  failedCount: number;
}

export interface DbHealthDto {
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  queueDepth: number;
}

export const PIPELINE_STATE_COLORS: Record<PipelineState, string> = {
  RUNNING:   '#16A34A',
  PAUSED:    '#D97706',
  STOPPED:   '#6B7280',
  FAILED:    '#DC2626',
  IDLE:      '#6B7280',
  COMPLETED: '#16A34A',
};

// Stage state uses the same color mapping as pipeline state
export const STAGE_STATE_COLORS: Record<StageState, string> = {
  RUNNING:   '#16A34A',
  PAUSED:    '#D97706',
  IDLE:      '#6B7280',
  FAILED:    '#DC2626',
  COMPLETED: '#16A34A',
};
