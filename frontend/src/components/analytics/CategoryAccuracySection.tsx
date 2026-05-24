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
import { BarChart3 } from 'lucide-react';
import { useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { useCategoryAccuracy } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartEmptyState } from './ChartEmptyState';
import { ChartErrorState } from './ChartErrorState';

interface CategoryAccuracySectionProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload: { category: string; total: number; overrideCount: number; overrideRate: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip-card">
      <p className="text-[14px] font-semibold mb-1">{d.category}</p>
      <p className="text-[14px]">Total: {d.total}</p>
      <p className="text-[14px]">Overrides: {d.overrideCount}</p>
      <p className="text-[14px]">Override Rate: {(d.overrideRate * 100).toFixed(1)}%</p>
    </div>
  );
}

export function CategoryAccuracySection({
  selectedCategory,
  onSelectCategory,
}: CategoryAccuracySectionProps) {
  const { startDate, endDate, isLoading: contextLoading } = useAnalyticsDate();
  const { data, isLoading, isError, refetch } = useCategoryAccuracy(startDate, endDate);

  const handleBarClick = (barData: { category: string }) => {
    if (selectedCategory === barData.category) {
      onSelectCategory(null);
    } else {
      onSelectCategory(barData.category);
    }
  };

  return (
    <div
      className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
      data-loading={contextLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Category Accuracy</h2>
      </div>

      {isLoading ? (
        <ChartSectionSkeleton />
      ) : isError ? (
        <ChartErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <ChartEmptyState
          icon={BarChart3}
          heading="No category data yet"
          body="Category accuracy will appear as classifications are reviewed."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border,#E5E7EB)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
              domain={[0, 1]}
            />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fontSize: 12 }}
              stroke="var(--color-border,#E5E7EB)"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="overrideRate"
              name="Override Rate"
              isAnimationActive={false}
              onClick={handleBarClick}
              cursor="pointer"
              label={{
                position: 'right',
                formatter: (value: number, entry: { payload?: { overrideRate?: number; category?: string } }) => {
                  const rate = entry?.payload?.overrideRate ?? 0;
                  return rate > 0.15 ? 'Above 15% threshold' : '';
                },
                style: { fill: '#DC2626', fontSize: 11 },
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={entry.overrideRate > 0.15 ? '#DC2626' : '#16A34A'}
                  opacity={selectedCategory === null || selectedCategory === entry.category ? 1 : 0.6}
                  stroke={selectedCategory === entry.category ? '#1D4ED8' : 'none'}
                  strokeWidth={selectedCategory === entry.category ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
