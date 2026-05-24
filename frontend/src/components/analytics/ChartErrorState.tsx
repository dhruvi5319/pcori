'use client';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ChartErrorStateProps {
  onRetry: () => void;
}

export function ChartErrorState({ onRetry }: ChartErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-3"
      data-testid="chart-error"
    >
      <AlertCircle size={24} className="text-[var(--color-muted,#9CA3AF)]" />
      <p className="text-[14px] font-normal text-[var(--color-muted,#9CA3AF)]">
        Failed to load — try again
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[14px] font-normal text-[var(--color-accent,#1D4ED8)] hover:opacity-80 transition-opacity"
        aria-label="Retry loading chart"
      >
        <RotateCcw size={14} />
        Retry
      </button>
    </div>
  );
}
