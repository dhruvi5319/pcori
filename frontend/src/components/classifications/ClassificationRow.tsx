'use client'
// classification-row CSS (inline Tailwind):
// Default: shadow E1 (0 1px 3px rgba(0,0,0,0.08)); bg-[#F4F6F9]
// Hover: shadow E2; translateY(-1px); bg-white; action icons fade in
// Transition: box-shadow 0.15s ease, transform 0.15s ease, background-color 0.1s ease

import { Eye, PenLine, RotateCcw } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Classification } from '@/types/classification'
import { formatRelativeDate } from '@/lib/utils'

interface ClassificationRowProps {
  classification: Classification
  onView: (id: string) => void
  onOverride: (id: string) => void
  onRetry: (id: string) => void
}

export function ClassificationRow({ classification: c, onView, onOverride, onRetry }: ClassificationRowProps) {
  const confidence = c.confidenceScore != null ? `${Math.round(c.confidenceScore * 100)}%` : '—'
  const confidenceColor = c.confidenceScore == null ? 'text-gray-400'
    : c.confidenceScore >= 0.85 ? 'text-[#16A34A]'
    : c.confidenceScore >= 0.70 ? 'text-[#D97706]'
    : 'text-[#DC2626]'

  return (
    <tr
      className="classification-row group cursor-pointer
                 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                 hover:-translate-y-[1px] hover:bg-white dark:hover:bg-[#1A1A1A]
                 transition-all duration-150 ease-out
                 bg-[#F4F6F9] dark:bg-[#141414]"
      style={{ height: '52px' }}
      onClick={() => onView(c.id)}
      role="row"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onView(c.id)}
    >
      {/* Plan ID — 14px/600 Geist Mono per UI-SPEC */}
      <td className="px-4 py-0 w-[120px]">
        <span className="font-mono text-[14px] font-semibold">{c.planId}</span>
      </td>
      {/* Title — flex-1 min 200px; truncated */}
      <td className="px-4 py-0 min-w-[200px] max-w-[300px]">
        <span className="block truncate text-[16px]" title={c.title}>{c.title ?? '—'}</span>
      </td>
      {/* Status */}
      <td className="px-4 py-0 w-[140px]">
        <StatusBadge status={c.status} />
      </td>
      {/* PCC */}
      <td className="px-4 py-0 w-[160px]">
        <span className="truncate text-[16px]">{c.pcc ?? '—'}</span>
      </td>
      {/* AI Confidence */}
      <td className={`px-4 py-0 w-[110px] text-[16px] ${confidenceColor}`}>
        {confidence}
      </td>
      {/* Uploaded */}
      <td className="px-4 py-0 w-[110px] text-[14px] text-gray-500" title={c.uploadedAt}>
        {formatRelativeDate(c.uploadedAt)}
      </td>
      {/* Actions — fade in on hover; row-actions class for CSS targeting */}
      <td className="px-4 py-0 w-[80px]">
        <div className="row-actions flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button onClick={e => { e.stopPropagation(); onView(c.id) }}
            aria-label={`View ${c.planId}`}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={e => { e.stopPropagation(); onOverride(c.id) }}
            aria-label={`Override ${c.planId}`}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <PenLine className="w-4 h-4 text-gray-500" />
          </button>
          {c.status === 'FAILED' && (
            <button onClick={e => { e.stopPropagation(); onRetry(c.id) }}
              aria-label={`Retry ${c.planId}`}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <RotateCcw className="w-4 h-4 text-[#DC2626]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
