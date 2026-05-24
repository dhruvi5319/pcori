'use client'

import { OneClickExportButton } from '@/components/reports/OneClickExportButton'
import { ReportsTabs } from '@/components/reports/ReportsTabs'

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <nav
            className="text-[14px] text-gray-500 dark:text-gray-400"
            aria-label="Breadcrumb"
          >
            Dashboard › Reports
          </nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">
            Reports
          </h1>
        </div>
        {/* One-Click Export CTA — gradient per UI-SPEC */}
        <OneClickExportButton />
      </div>

      {/* Radix Tabs: My Reports / Ad-hoc Builder / Templates */}
      <ReportsTabs />
    </div>
  )
}
