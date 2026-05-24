'use client'

import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { UploadPlanDialog } from '@/components/classifications/UploadPlanDialog'

export function DashboardEmptyState() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <BarChart3
          className="h-12 w-12 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <h3 className="text-[24px] font-[600] text-[var(--color-foreground)]">
          No data yet
        </h3>
        <p className="text-[16px] font-[400] text-[var(--color-muted)] text-center max-w-sm">
          Upload your first research plan to start seeing KPI metrics.
        </p>
        <button
          onClick={() => setUploadOpen(true)}
          className="px-6 py-2.5 rounded-[8px] text-[16px] font-[600] text-white bg-gradient-to-r from-[#1D4ED8] to-[#7C3AED] hover:opacity-90 transition-opacity"
        >
          Upload Plan
        </button>
      </div>

      <UploadPlanDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  )
}
