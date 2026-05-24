'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DashboardEmptyState } from './DashboardEmptyState'
import { useRecentClassifications } from '@/hooks/useDashboard'
import type { Classification } from '@/types/classification'

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString()
}

function getConfidenceDotColor(score: number): string {
  if (score >= 0.85) return '#16A34A'
  if (score >= 0.7) return '#D97706'
  return '#DC2626'
}

function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

function RecentFeedRowSkeleton() {
  return (
    <tr>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-5 w-24 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-5 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-6 w-28 rounded-full" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-5 w-20 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-5 w-12 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="skeleton-shimmer h-5 w-16 rounded" />
      </td>
    </tr>
  )
}

interface FeedRowProps {
  classification: Classification
}

function FeedRow({ classification }: FeedRowProps) {
  return (
    <tr
      className="hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.03))] transition-colors cursor-pointer"
      onClick={() => {
        window.location.href = `/classifications?id=${classification.id}`
      }}
    >
      <td className="py-3 px-4 w-[120px]">
        <span className="font-mono text-[14px] font-[600] text-[var(--color-foreground)]">
          {classification.planId}
        </span>
      </td>
      <td className="py-3 px-4 max-w-0">
        <span
          className="block truncate text-[14px] text-[var(--color-foreground)]"
          title={classification.title}
        >
          {classification.title ?? '—'}
        </span>
      </td>
      <td className="py-3 px-4 w-[140px]">
        <StatusBadge status={classification.status} />
      </td>
      <td className="py-3 px-4 w-[150px]">
        <span className="text-[14px] text-[var(--color-muted)]">
          {classification.pcc ?? '—'}
        </span>
      </td>
      <td className="py-3 px-4 w-[80px]">
        {classification.confidenceScore != null ? (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: getConfidenceDotColor(classification.confidenceScore) }}
              aria-hidden="true"
            />
            <span className="text-[14px] text-[var(--color-foreground)]">
              {formatConfidence(classification.confidenceScore)}
            </span>
          </div>
        ) : (
          <span className="text-[14px] text-[var(--color-muted)]">—</span>
        )}
      </td>
      <td className="py-3 px-4 w-[90px]">
        <span className="text-[14px] text-[var(--color-muted)]">
          {formatRelativeDate(classification.uploadedAt)}
        </span>
      </td>
    </tr>
  )
}

export function RecentClassificationsFeed() {
  const { data, isLoading, isError } = useRecentClassifications()

  const classifications = data?.content ?? []
  const isEmpty = !isLoading && !isError && classifications.length === 0

  return (
    <div
      data-testid="recent-classifications-feed"
      className={cn(
        'rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
        'bg-[var(--color-surface)] overflow-hidden'
      )}
    >
      <div className="px-4 py-4 border-b border-[var(--color-border,rgba(0,0,0,0.08))]">
        <h2 className="text-[16px] font-[600] text-[var(--color-foreground)]">
          Recent Classifications
        </h2>
      </div>

      {isEmpty ? (
        <DashboardEmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border,rgba(0,0,0,0.08))]">
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)] w-[120px]">
                    Plan ID
                  </th>
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)]">
                    Title
                  </th>
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)] w-[140px]">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)] w-[150px]">
                    PCC
                  </th>
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)] w-[80px]">
                    Confidence
                  </th>
                  <th className="py-3 px-4 text-left text-[14px] font-[400] text-[var(--color-muted)] w-[90px]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => <RecentFeedRowSkeleton key={i} />)
                  : classifications.map((c) => <FeedRow key={c.id} classification={c} />)}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-[var(--color-border,rgba(0,0,0,0.08))]">
            <Link
              href="/classifications"
              className="text-[14px] text-[#2563EB] dark:text-[#3B82F6] hover:underline"
            >
              View all Classifications →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
