'use client';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { useAccuracyTrend } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';

type Granularity = 'day' | 'week' | 'month';

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-card">
      <p className="text-[14px] font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-[14px]" style={{ color: entry.color }}>
          {entry.name}: {(entry.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

export function AccuracyTrendSection() {
  const { startDate, endDate, isLoading: contextLoading } = useAnalyticsDate();
  const [granularity, setGranularity] = useState<Granularity>('day');
  const { data, isLoading, isError, refetch } = useAccuracyTrend(startDate, endDate, granularity);

  return (
    <div
      className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
      data-loading={contextLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Accuracy Trend</h2>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-2 py-1 text-[12px] rounded transition-colors ${
                granularity === g
                  ? 'bg-[var(--color-accent,#1D4ED8)] text-white'
                  : 'bg-transparent border border-[var(--color-border,#E5E7EB)] text-[var(--color-muted,#6B7280)] hover:bg-[var(--color-surface-hover,#F4F6F9)]'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ChartSectionSkeleton />
      ) : isError ? (
        <ChartErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <ChartEmptyState
          icon={TrendingUp}
          heading="No accuracy data yet"
          body="Accuracy trend will appear as override data accumulates."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#E5E7EB)" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
            />
            <YAxis
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
              domain={[0, 1]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="aiAccuracy"
              name="AI Accuracy"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="humanCorrectedAccuracy"
              name="Human-Corrected"
              stroke="#7C3AED"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
