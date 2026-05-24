'use client';
import type { LucideIcon } from 'lucide-react';

interface ChartEmptyStateProps {
  icon: LucideIcon;
  heading: string;
  body: string;
}

export function ChartEmptyState({ icon: Icon, heading, body }: ChartEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Icon size={48} className="text-[var(--color-muted,#9CA3AF)]" />
      <p className="text-[16px] font-semibold text-[var(--color-foreground)]">{heading}</p>
      <p className="text-[14px] font-normal text-[var(--color-muted,#9CA3AF)] text-center max-w-xs">
        {body}
      </p>
    </div>
  );
}
