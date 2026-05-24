'use client'

import { BookOpen } from 'lucide-react'

export function HelpEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <BookOpen
        className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4"
        aria-hidden="true"
      />
      <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white mb-2">
        No articles yet
      </h2>
      <p className="text-[16px] text-gray-500 dark:text-gray-400 max-w-sm">
        Help articles haven&apos;t been added yet. Contact your administrator.
      </p>
    </div>
  )
}
