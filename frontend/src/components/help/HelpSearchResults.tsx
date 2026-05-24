'use client'

import type { HelpArticle } from '@/types/help'

interface HelpSearchResultsProps {
  results: HelpArticle[]
  searchTerm: string
  onSelect: (slug: string) => void
  onClose: () => void
}

function highlightTerm(text: string, term: string) {
  if (!term || term.length < 2) return text
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold">{text.slice(idx, idx + term.length)}</strong>
      {text.slice(idx + term.length)}
    </>
  )
}

export function HelpSearchResults({
  results,
  searchTerm,
  onSelect,
  onClose,
}: HelpSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div
        role="listbox"
        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1A1A1A] shadow-md p-4"
      >
        <p className="text-[14px] text-gray-500 dark:text-gray-400">
          No articles found for &ldquo;{searchTerm}&rdquo;
        </p>
        <a
          href="mailto:support@example.com"
          className="text-[14px] text-[#1D4ED8] dark:text-blue-400 hover:underline mt-2 block"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact Support ↗
        </a>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1A1A1A] shadow-md"
    >
      {results.map((article) => {
        // Get a short snippet from the content
        const snippet = article.content.replace(/[#*`]/g, '').slice(0, 120)

        return (
          <button
            key={article.id}
            role="option"
            aria-selected={false}
            onClick={() => {
              onSelect(article.slug)
              onClose()
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.04)] border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
          >
            <div className="text-[14px] font-semibold text-gray-900 dark:text-white">
              {article.title}
            </div>
            <div className="text-[14px] text-gray-500 dark:text-gray-400 mt-0.5">
              {article.category}
            </div>
            {snippet && (
              <div className="text-[14px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {highlightTerm(snippet, searchTerm)}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
