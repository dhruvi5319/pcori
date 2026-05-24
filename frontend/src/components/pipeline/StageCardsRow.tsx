'use client'

import { StageCard } from './StageCard'
import type { PipelineStageDto } from '@/types/pipeline'

interface StageCardsRowProps {
  stages: PipelineStageDto[]
  onRetryStage?: (stageName: string) => void
}

export function StageCardsRow({ stages, onRetryStage }: StageCardsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {stages.map((stage) => (
        <StageCard
          key={stage.name}
          stage={stage}
          onRetry={onRetryStage}
        />
      ))}
    </div>
  )
}
