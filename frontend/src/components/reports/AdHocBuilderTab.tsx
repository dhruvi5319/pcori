'use client'

import { useState } from 'react'
import { ColumnSelectorPanel, AVAILABLE_COLUMNS } from './ColumnSelectorPanel'
import { BuilderFilterPanel, FilterValues } from './BuilderFilterPanel'
import { ReportPreviewPanel } from './ReportPreviewPanel'

const DEFAULT_FILTERS: FilterValues = {
  status: [],
  startDate: '',
  endDate: '',
  pcc: '',
}

export function AdHocBuilderTab() {
  // Default: all 13 columns selected
  const [selectedColumns, setSelectedColumns] = useState<string[]>([...AVAILABLE_COLUMNS])
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS)

  const filtersJson = JSON.stringify({
    status: filters.status.length > 0 ? filters.status : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    pcc: filters.pcc || undefined,
  })

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
      {/* Left column: Column Selector + Filter Panel */}
      <div className="flex flex-col gap-4">
        <ColumnSelectorPanel
          selectedColumns={selectedColumns}
          onSelectionChange={setSelectedColumns}
        />
        <BuilderFilterPanel filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Right column: Preview Panel */}
      <div className="flex-1">
        <ReportPreviewPanel
          selectedColumns={selectedColumns}
          filtersJson={filtersJson}
        />
      </div>
    </div>
  )
}
