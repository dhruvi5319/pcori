'use client'

import { Eye, PenLine, RotateCcw } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRelativeDate } from '@/lib/utils'
import type { Classification } from '@/types/classification'

interface ClassificationRowProps {
  classification: Classification
  onView: (id: string) => void
  onOverride: (id: string) => void
  onRetry: (id: string) => void
}

function getConfidenceColor(score: number | undefined): string {
  if (score == null) return 'text-gray-400'
  if (score >= 0.85) return 'text-[#16A34A] dark:text-[#4ADE80]'
  if (score >= 0.70) return 'text-[#D97706] dark:text-[#FCD34D]'
  return 'text-[#DC2626] dark:text-[#F87171]'
}

export function ClassificationRow({
  classification: c,
  onView,
  onOverride,
  onRetry,
}: ClassificationRowProps) {
  const confidence = c.confidenceScore != null ? `${Math.round(c.confidenceScore * 100)}%` : '—'
  const confidenceColor = getConfidenceColor(c.confidenceScore)

  return (
    <tr
      className="group cursor-pointer border-b border-gray-100 dark:border-gray-800
                 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                 hover:-translate-y-[1px] hover:bg-white dark:hover:bg-[#1A1A1A]
                 bg-[#F4F6F9] dark:bg-[#141414]
                 transition-all duration-150 ease-out"
      style={{ height: '52px' }}
      onClick={() => onView(c.id)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(c.id)}
    >
      {/* Plan ID — Geist Mono 14px/600 per UI-SPEC */}
      <td className="px-4 py-0 w-[120px]">
        <span className="font-mono text-[14px] font-semibold tracking-tight">{c.planId}</span>
      </td>

      {/* Title */}
      <td className="px-4 py-0 min-w-[200px] max-w-[300px]">
        <span
          className="block truncate text-[16px] text-gray-900 dark:text-gray-100"
          title={c.title}
        >
          {c.title ?? '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-0 w-[140px]">
        <StatusBadge status={c.status} />
      </td>

      {/* PCC */}
      <td className="px-4 py-0 w-[160px]">
        <span className="truncate text-[16px] text-gray-700 dark:text-gray-300">
          {c.pcc ?? '—'}
        </span>
      </td>

      {/* AI Confidence with color bands */}
      <td className={`px-4 py-0 w-[110px] text-[16px] font-medium ${confidenceColor}`}>
        {confidence}
      </td>

      {/* Uploaded — relative date */}
      <td
        className="px-4 py-0 w-[110px] text-[14px] text-gray-500 dark:text-gray-400"
        title={c.uploadedAt}
      >
        {formatRelativeDate(c.uploadedAt)}
      </td>

      {/* Actions — fade in on hover */}
      <td className="px-4 py-0 w-[80px]">
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          role="group"
          aria-label="Row actions"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView(c.id)
            }}
            aria-label={`View ${c.planId}`}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOverride(c.id)
            }}
            aria-label={`Override ${c.planId}`}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <PenLine className="w-4 h-4 text-gray-500" />
          </button>
          {c.status === 'FAILED' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRetry(c.id)
              }}
              aria-label={`Retry ${c.planId}`}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-[#DC2626]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
