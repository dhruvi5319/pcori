'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTaxonomySearch } from '@/hooks/useTaxonomy'

interface TaxonomySearchBarProps {
  onSelect: (id: string) => void
}

export function TaxonomySearchBar({ onSelect }: TaxonomySearchBarProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 300)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const { data: results, isFetching } = useTaxonomySearch(debouncedQuery)
  const showResults = debouncedQuery.length > 0

  return (
    <div className="flex flex-col gap-1">
      {/* Search input with icon */}
      <div className="relative">
        {isFetching && debouncedQuery ? (
          <Loader2
            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400"
            aria-hidden="true"
          />
        ) : (
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            aria-hidden="true"
          />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by code, name…"
          aria-label="Search taxonomy categories"
          className="w-full h-9 pl-8 pr-3 text-[14px] border border-gray-200 dark:border-gray-700
                     rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition-shadow"
        />
      </div>

      {/* Results list */}
      {showResults && (
        <div
          className="flex flex-col max-h-[240px] overflow-y-auto
                     border border-gray-200 dark:border-gray-800
                     rounded-lg bg-white dark:bg-[#1A1A1A]
                     shadow-md"
          role="listbox"
          aria-label="Search results"
        >
          {!results || results.length === 0 ? (
            <p className="p-3 text-[14px] text-gray-400">
              No taxonomy codes match &apos;{debouncedQuery}&apos;
            </p>
          ) : (
            results.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setQuery('')
                  setDebouncedQuery('')
                  onSelect(cat.id)
                }}
                className="flex flex-col items-start px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800
                           text-left transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                role="option"
                aria-selected={false}
              >
                <span className="text-[14px] text-gray-900 dark:text-gray-100">
                  <span className="font-mono">{cat.code}</span>
                  <span className="text-gray-400"> — </span>
                  {cat.name}
                </span>
                <span className="text-[12px] text-gray-400">
                  Level {cat.level} · {cat.parentCode ? `Parent: ${cat.parentCode}` : 'Root'}
                  {!cat.isActive && ' · Inactive'}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
