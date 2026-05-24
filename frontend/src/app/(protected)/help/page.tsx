'use client'

import { useState } from 'react'
import { useArticles } from '@/hooks/useHelp'
import { HelpCategorySidebar } from '@/components/help/HelpCategorySidebar'
import { HelpArticleView } from '@/components/help/HelpArticleView'
import { HelpSearchBar } from '@/components/help/HelpSearchBar'
import { HelpEmptyState } from '@/components/help/HelpEmptyState'
import { FaqSection } from '@/components/help/FaqSection'

export default function HelpPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const { data: articles } = useArticles()

  // Auto-select first article when articles load
  const effectiveSlug =
    selectedSlug ?? (articles && articles.length > 0 ? articles[0].slug : null)

  const hasArticles = articles && articles.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <nav
            className="text-[14px] text-gray-500 dark:text-gray-400"
            aria-label="Breadcrumb"
          >
            Dashboard › Help Center
          </nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">
            Help Center
          </h1>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — 240px fixed sidebar */}
        <aside
          className="w-[240px] flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#2A2A2A]
                     bg-[#F4F6F9] dark:bg-[#141414] overflow-y-auto hidden md:block"
          aria-label="Help categories"
        >
          <HelpCategorySidebar
            selectedSlug={effectiveSlug}
            onSelect={(slug) => setSelectedSlug(slug)}
          />
        </aside>

        {/* Right pane — fluid article area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Search bar in article area header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <HelpSearchBar onSelect={(slug) => setSelectedSlug(slug)} />
          </div>

          {/* Article content or empty state */}
          <div className="flex-1">
            {hasArticles ? (
              <HelpArticleView slug={effectiveSlug} />
            ) : (
              articles !== undefined && <HelpEmptyState />
            )}
          </div>

          {/* FAQ section below article */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <FaqSection />
          </div>
        </div>
      </div>
    </div>
  )
}
