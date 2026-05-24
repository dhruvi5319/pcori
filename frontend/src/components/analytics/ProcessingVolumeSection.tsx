'use client';
import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { useProcessingVolume } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';

type Granularity = 'day' | 'week' | 'month';

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip-card">
      <p className="text-[14px] font-semibold mb-1">{label}</p>
      <p className="text-[14px]">Count: {payload[0].value}</p>
    </div>
  );
}

export function ProcessingVolumeSection() {
  const { startDate, endDate, isLoading: contextLoading } = useAnalyticsDate();
  const [granularity, setGranularity] = useState<Granularity>('day');
  const { data, isLoading, isError, refetch } = useProcessingVolume(startDate, endDate, granularity);

  return (
    <div
      className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
      data-loading={contextLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Processing Volume</h2>
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
          icon={BarChart2}
          heading="No volume data yet"
          body="Processing volume will appear as plans are submitted."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="processingVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#E5E7EB)" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Count"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#processingVolumeGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
