'use client'

import { useArticles } from '@/hooks/useHelp'
import { HelpSidebarSkeleton } from './HelpArticleSkeleton'
import { HelpEmptyState } from './HelpEmptyState'

interface HelpCategorySidebarProps {
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

export function HelpCategorySidebar({ selectedSlug, onSelect }: HelpCategorySidebarProps) {
  const { data: articles, isLoading, isError } = useArticles()

  if (isLoading) {
    return <HelpSidebarSkeleton />
  }

  if (isError || !articles || articles.length === 0) {
    return (
      <div className="p-3 text-[14px] text-gray-500 dark:text-gray-400">
        No articles available
      </div>
    )
  }

  // Group articles by category
  const groups = articles.reduce<Record<string, typeof articles>>((acc, article) => {
    const cat = article.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(article)
    return acc
  }, {})

  return (
    <nav aria-label="Help article categories" className="flex flex-col py-2">
      {Object.entries(groups).map(([category, categoryArticles]) => (
        <div key={category} className="mb-3">
          {/* Category label */}
          <div className="px-3 py-1 text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {category}
          </div>

          {/* Article links */}
          {categoryArticles.map((article) => {
            const isSelected = selectedSlug === article.slug
            return (
              <button
                key={article.id}
                onClick={() => onSelect(article.slug)}
                className={[
                  'w-full text-left px-3 py-1.5 text-[14px] transition-colors',
                  'hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]',
                  isSelected
                    ? 'bg-[#EFF6FF] dark:bg-[rgba(30,58,95,0.2)] border-l-[3px] border-[#1D4ED8] text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300',
                ].join(' ')}
              >
                {article.title}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
