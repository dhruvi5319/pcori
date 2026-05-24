'use client'

import { UserX } from 'lucide-react'

interface UsersEmptyStateProps {
  onClearFilters?: () => void
}

export function UsersEmptyState({ onClearFilters }: UsersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
      <UserX className="w-12 h-12 text-gray-400 dark:text-gray-600" aria-hidden="true" />
      <div className="text-center">
        <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white">
          No users found
        </h3>
        <p className="mt-2 text-[16px] text-gray-500 dark:text-gray-400 max-w-sm">
          No users match your search. Try different keywords or clear the filters.
        </p>
      </div>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="text-[14px] text-[#1D4ED8] dark:text-[#3B82F6] hover:underline
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] rounded"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
