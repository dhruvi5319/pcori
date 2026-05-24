'use client';
import { useState } from 'react';
import { Edit, X } from 'lucide-react';
import { useRecentOverrides } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';

interface RecentOverridesSectionProps {
  selectedCategory: string | null;
  onClearCategory: () => void;
}

export function RecentOverridesSection({
  selectedCategory,
  onClearCategory,
}: RecentOverridesSectionProps) {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useRecentOverrides(page, 10);

  const overrides = data?.content ?? [];
  const hasMore = data ? !data.last : false;

  // Filter by selected category if set
  const filteredOverrides = selectedCategory
    ? overrides.filter(
        (o) => o.originalCategory === selectedCategory || o.overrideCategory === selectedCategory
      )
    : overrides;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  }

  return (
    <div className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Recent Overrides</h2>
      </div>

      {selectedCategory && (
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-accent-muted,#DBEAFE)] text-[var(--color-accent,#1D4ED8)] rounded-full text-[12px] font-medium">
            {selectedCategory}
            <button
              onClick={onClearCategory}
              className="ml-1 hover:opacity-70"
              aria-label="Clear category filter"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {isLoading ? (
        <ChartSectionSkeleton />
      ) : isError ? (
        <ChartErrorState onRetry={refetch} />
      ) : filteredOverrides.length === 0 ? (
        <ChartEmptyState
          icon={Edit}
          heading="No overrides yet"
          body="Recent overrides will appear here as reviewers correct AI classifications."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border,#E5E7EB)]">
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2 pr-3">
                    Plan ID
                  </th>
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2 pr-3">
                    Reviewer
                  </th>
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2 pr-3">
                    Original
                  </th>
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2 pr-3">
                    Override
                  </th>
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2 pr-3">
                    Reason
                  </th>
                  <th className="text-left text-[12px] font-semibold text-[var(--color-muted,#6B7280)] pb-2">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOverrides.map((override) => (
                  <tr
                    key={override.classificationId}
                    className="border-b border-[var(--color-border,#E5E7EB)] hover:bg-[var(--color-surface-hover,#F4F6F9)] transition-colors"
                  >
                    <td className="py-2.5 pr-3 font-mono text-[14px] font-semibold">
                      {override.planId}
                    </td>
                    <td className="py-2.5 pr-3 text-[14px]">
                      {override.reviewerUsername}
                    </td>
                    <td className="py-2.5 pr-3 text-[14px] text-[var(--color-muted,#6B7280)]">
                      {override.originalCategory}
                    </td>
                    <td className="py-2.5 pr-3 text-[14px] text-[#1D4ED8] dark:text-[#3B82F6]">
                      {override.overrideCategory}
                    </td>
                    <td
                      className="py-2.5 pr-3 text-[14px] max-w-[200px] truncate"
                      title={override.overrideReason}
                    >
                      {override.overrideReason.length > 60
                        ? override.overrideReason.slice(0, 60) + '…'
                        : override.overrideReason}
                    </td>
                    <td className="py-2.5 text-[14px] text-[var(--color-muted,#6B7280)]">
                      {formatDate(override.reviewedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="text-[14px] text-[var(--color-accent,#1D4ED8)] hover:opacity-80 transition-opacity"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
