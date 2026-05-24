'use client';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { useModelPerformance } from '@/hooks/useAnalytics';
import { ChartSectionSkeleton } from './ChartSectionSkeleton';
import { ChartErrorState } from './ChartErrorState';

interface MetricCardProps {
  label: string;
  value: number;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)] flex flex-col items-center gap-2">
      <p className="text-[24px] font-semibold">{value.toFixed(2)}</p>
      <p className="text-[14px] font-normal text-[var(--color-muted,#9CA3AF)]">{label}</p>
    </div>
  );
}

export function ModelPerformanceSection() {
  const { startDate, endDate, isLoading: contextLoading } = useAnalyticsDate();
  const { data, isLoading, isError, refetch } = useModelPerformance(startDate, endDate);

  const insufficientData = !data || data.totalEvaluated < 10;

  return (
    <div
      className="analytics-chart-section bg-[var(--color-surface)] rounded-[12px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]"
      data-loading={contextLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Model Performance</h2>
      </div>

      {isLoading ? (
        <ChartSectionSkeleton />
      ) : isError ? (
        <ChartErrorState onRetry={refetch} />
      ) : insufficientData ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <BarChart3 size={32} className="text-[var(--color-muted,#9CA3AF)]" />
          <p className="text-[16px] font-semibold">Insufficient data</p>
          <p className="text-[14px] font-normal text-[var(--color-muted,#9CA3AF)] text-center max-w-xs">
            At least 10 evaluated records are required to compute model performance metrics.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Precision" value={data!.precision} />
            <MetricCard label="Recall" value={data!.recall} />
            <MetricCard label="F1 Score" value={data!.f1Score} />
          </div>
          <p className="mt-4 text-[14px] font-normal text-[var(--color-muted,#9CA3AF)] text-center">
            Based on {data!.totalEvaluated} evaluated records
          </p>
        </div>
      )}
    </div>
  );
}
