'use client'

import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

// 13 columns in exact UX-spec order
export const AVAILABLE_COLUMNS = [
  'Plan ID',
  'Title',
  'Status',
  'PCC',
  'Taxonomy Category',
  'Code',
  'Subcode',
  'AI Confidence',
  'Uploaded By',
  'Upload Date',
  'Classified Date',
  'Reviewed By',
  'Override Reason',
]

interface ColumnSelectorPanelProps {
  selectedColumns: string[]
  onSelectionChange: (columns: string[]) => void
}

export function ColumnSelectorPanel({ selectedColumns, onSelectionChange }: ColumnSelectorPanelProps) {
  const allSelected = selectedColumns.length === AVAILABLE_COLUMNS.length
  const noneSelected = selectedColumns.length === 0

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      onSelectionChange(selectedColumns.filter((c) => c !== col))
    } else {
      onSelectionChange([...selectedColumns, col])
    }
  }

  const selectAll = () => onSelectionChange([...AVAILABLE_COLUMNS])
  const deselectAll = () => onSelectionChange([])

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-[#1A1A1A]">
      {/* Section title */}
      <p className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        STEP 1: Columns
      </p>

      {/* Scrollable checklist — max-height 320px */}
      <div
        className="overflow-y-auto flex flex-col gap-2"
        style={{ maxHeight: '320px' }}
      >
        {AVAILABLE_COLUMNS.map((col) => {
          const isChecked = selectedColumns.includes(col)
          const checkboxId = `col-${col.replace(/\s+/g, '-').toLowerCase()}`
          return (
            <div key={col} className="flex items-center gap-2">
              <Checkbox.Root
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={() => toggleColumn(col)}
                className="flex h-4 w-4 items-center justify-center rounded
                           border border-[#E5E7EB] dark:border-gray-600
                           data-[state=checked]:bg-[#1D4ED8] data-[state=checked]:border-[#1D4ED8]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-1
                           transition-colors cursor-pointer"
              >
                <Checkbox.Indicator>
                  <Check className="w-3 h-3 text-white" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor={checkboxId}
                className="text-[14px] text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                {col}
              </label>
            </div>
          )
        })}
      </div>

      {/* Select all / Deselect all links */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={selectAll}
          disabled={allSelected}
          className="text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select all
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          onClick={deselectAll}
          disabled={noneSelected}
          className="text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Deselect all
        </button>
      </div>
    </div>
  )
}
