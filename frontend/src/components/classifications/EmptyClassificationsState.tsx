import { FileSearch, SearchX } from 'lucide-react'

interface EmptyClassificationsStateProps {
  hasActiveFilters: boolean
  onUpload?: () => void
  onClearFilters?: () => void
}

export function EmptyClassificationsState({ hasActiveFilters, onUpload, onClearFilters }: EmptyClassificationsStateProps) {
  if (hasActiveFilters) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <SearchX className="w-12 h-12 text-gray-400" />
      <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white">No plans match your filters</h3>
      <p className="text-[16px] text-gray-500 text-center max-w-md">
        Try adjusting your filters or clearing them to see all plans.
      </p>
      <button onClick={onClearFilters} className="text-[#1D4ED8] dark:text-[#3B82F6] underline text-[16px]">
        Clear all filters
      </button>
    </div>
  )
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <FileSearch className="w-12 h-12 text-gray-400" />
      <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white">No research plans yet</h3>
      <p className="text-[16px] text-gray-500 text-center max-w-md">
        Upload your first research plan PDF to get started. The system will automatically classify it against the PCORI taxonomy.
      </p>
      <button onClick={onUpload}
        className="px-4 py-2 rounded-lg text-white text-[16px]
                   bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                   hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150">
        Upload Plan
      </button>
    </div>
  )
}
