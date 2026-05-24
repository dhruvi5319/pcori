'use client';
import { useState } from 'react';
import { AnalyticsDateProvider, useAnalyticsDate } from '@/contexts/AnalyticsDateContext';
import { AccuracyTrendSection } from '@/components/analytics/AccuracyTrendSection';
import { CategoryAccuracySection } from '@/components/analytics/CategoryAccuracySection';
import { ConfidenceDistributionSection } from '@/components/analytics/ConfidenceDistributionSection';
import { ProcessingVolumeSection } from '@/components/analytics/ProcessingVolumeSection';
import { RecentOverridesSection } from '@/components/analytics/RecentOverridesSection';
import { ModelPerformanceSection } from '@/components/analytics/ModelPerformanceSection';

function AnalyticsPageContent() {
  const { startDate, endDate, setDateRange, isLoading } = useAnalyticsDate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newStart = e.target.value;
    setLocalStart(newStart);
    if (newStart && localEnd && newStart >= localEnd) {
      setDateError('Start date must be before end date');
    } else {
      setDateError(null);
      if (newStart && localEnd) {
        setDateRange(newStart, localEnd);
      }
    }
  }

  function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newEnd = e.target.value;
    setLocalEnd(newEnd);
    if (localStart && newEnd && localStart >= newEnd) {
      setDateError('Start date must be before end date');
    } else {
      setDateError(null);
      if (localStart && newEnd) {
        setDateRange(localStart, newEnd);
      }
    }
  }

  function handleReset() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = thirtyDaysAgo.toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    setLocalStart(start);
    setLocalEnd(end);
    setDateError(null);
    setDateRange(start, end);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold">Analytics</h1>
          <p className="text-[14px] text-[var(--color-muted,#6B7280)] mt-1">
            Filter applied: {startDate} – {endDate}{' '}
            <button
              onClick={handleReset}
              className="text-[var(--color-accent,#1D4ED8)] hover:opacity-80 underline ml-1"
            >
              Reset to default
            </button>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-[14px] text-[var(--color-muted,#6B7280)]" htmlFor="analytics-start-date">
              From
            </label>
            <input
              id="analytics-start-date"
              type="date"
              value={localStart}
              onChange={handleStartChange}
              className="border border-[var(--color-border,#E5E7EB)] rounded-[8px] px-3 py-1.5 text-[14px] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#1D4ED8)]"
              aria-label="Start date"
            />
            <label className="text-[14px] text-[var(--color-muted,#6B7280)]" htmlFor="analytics-end-date">
              To
            </label>
            <input
              id="analytics-end-date"
              type="date"
              value={localEnd}
              onChange={handleEndChange}
              className="border border-[var(--color-border,#E5E7EB)] rounded-[8px] px-3 py-1.5 text-[14px] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#1D4ED8)]"
              aria-label="End date"
            />
          </div>
          {dateError && (
            <p className="text-[14px] font-normal text-[#DC2626]">{dateError}</p>
          )}
          {isLoading && (
            <p className="text-[12px] text-[var(--color-muted,#6B7280)]">Updating charts…</p>
          )}
        </div>
      </div>

      {/* Row 1: Accuracy Trend + Category Accuracy */}
      <div className="grid grid-cols-2 gap-6">
        <AccuracyTrendSection />
        <CategoryAccuracySection
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Row 2: Confidence Distribution + Processing Volume */}
      <div className="grid grid-cols-2 gap-6">
        <ConfidenceDistributionSection />
        <ProcessingVolumeSection />
      </div>

      {/* Row 3: Recent Overrides (full-width) */}
      <RecentOverridesSection
        selectedCategory={selectedCategory}
        onClearCategory={() => setSelectedCategory(null)}
      />

      {/* Row 4: Model Performance (full-width) */}
      <ModelPerformanceSection />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AnalyticsDateProvider>
      <AnalyticsPageContent />
    </AnalyticsDateProvider>
  );
}
