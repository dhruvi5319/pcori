'use client'
import { useState, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTaxonomySearch } from '@/hooks/useTaxonomy'

interface TaxonomySearchBarProps { onSelect: (id: string) => void }

export function TaxonomySearchBar({ onSelect }: TaxonomySearchBarProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    clearTimeout((window as any)._taxSearchTimer)
    ;(window as any)._taxSearchTimer = setTimeout(() => setDebouncedQuery(value), 300)
  }, [])

  const { data: results, isFetching } = useTaxonomySearch(debouncedQuery)
  const showResults = debouncedQuery.length > 0

  return (
    <div className="flex flex-col gap-1">
      {/* Search input with icon */}
      <div className="relative">
        {isFetching && debouncedQuery
          ? <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          : <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        }
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder="Search by code, name…"
          className="w-full h-9 pl-8 pr-3 text-[14px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
        />
      </div>

      {/* Results list */}
      {showResults && (
        <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#141414]">
          {!results || results.length === 0 ? (
            <p className="p-3 text-[14px] text-gray-400">
              No taxonomy codes match &apos;{debouncedQuery}&apos;
            </p>
          ) : results.map(cat => (
            <button key={cat.id}
              onClick={() => { setQuery(''); setDebouncedQuery(''); onSelect(cat.id) }}
              className="flex flex-col items-start px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
              {/* Result format: CODE — Name per UI-SPEC */}
              <span className="text-[14px]">
                <span className="font-mono">{cat.code}</span>
                <span className="text-gray-400"> — </span>
                {cat.name}
              </span>
              {/* Level + parent info */}
              <span className="text-[12px] text-gray-400">
                Level {cat.level} · {cat.parentCode ? `Parent: ${cat.parentCode}` : 'Root'}
                {!cat.isActive && ' · Inactive'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
