'use client';

export function ChartSectionSkeleton() {
  return (
    <div
      className="skeleton-shimmer rounded-[12px] w-full"
      style={{ minHeight: 320 }}
      aria-label="Loading chart..."
    />
  );
}
