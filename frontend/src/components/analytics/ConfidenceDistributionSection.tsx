'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import { useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { useConfidenceDistribution } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';
import type { ConfidenceDistributionDto } from '@/types/analytics';

function getBarColor(high: number): string {
  if (high <= 0.7) return '#DC2626'; // red — low confidence
  if (high <= 0.85) return '#D97706'; // amber — medium confidence
  return '#16A34A'; // green — high confidence
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: ConfidenceDistributionDto & { percentage?: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip-card">
      <p className="text-[14px] font-semibold mb-1">
        {d.low.toFixed(2)} – {d.high.toFixed(2)}
      </p>
      <p className="text-[14px]">Count: {d.count}</p>
      {d.percentage !== undefined && (
        <p className="text-[14px]">{d.percentage.toFixed(1)}% of total</p>
      )}
    </div>
  );
}

export function ConfidenceDistributionSection() {
  const { startDate, endDate, isLoading: contextLoading } = useAnalyticsDate();
  const { data, isLoading, isError, refetch } = useConfidenceDistribution(startDate, endDate);

  // Compute percentages for tooltip
  const total = data?.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const dataWithPercentage = data?.map((d) => ({
    ...d,
    percentage: total > 0 ? (d.count / total) * 100 : 0,
    label: `${d.low.toFixed(1)}–${d.high.toFixed(1)}`,
  }));

  return (
    <div
      className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
      data-loading={contextLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">AI Confidence Distribution</h2>
      </div>

      {isLoading ? (
        <ChartSectionSkeleton />
      ) : isError ? (
        <ChartErrorState onRetry={refetch} />
      ) : !data || data.every((d) => d.count === 0) ? (
        <ChartEmptyState
          icon={Activity}
          heading="No confidence data yet"
          body="Confidence distribution will appear as plans are classified."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={dataWithPercentage}
            barCategoryGap="2%"
            margin={{ top: 4, right: 8, left: 0, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#E5E7EB)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="var(--color-border,#E5E7EB)"
              label={{
                value: 'AI Confidence Score',
                position: 'insideBottom',
                offset: -16,
                style: { fontSize: 12, fill: 'var(--color-muted,#6B7280)' },
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" isAnimationActive={false}>
              {dataWithPercentage?.map((entry) => (
                <Cell key={entry.bucket} fill={getBarColor(entry.high)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
