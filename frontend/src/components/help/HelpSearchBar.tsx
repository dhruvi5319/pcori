'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useSearchArticles } from '@/hooks/useHelp'
import { HelpSearchResults } from './HelpSearchResults'

interface HelpSearchBarProps {
  onSelect: (slug: string) => void
}

export function HelpSearchBar({ onSelect }: HelpSearchBarProps) {
  const [value, setValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [overlayOpen, setOverlayOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 300ms debounce
  useEffect(() => {
    if (value.length >= 2) {
      const timer = setTimeout(() => {
        setDebouncedQuery(value)
        setOverlayOpen(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setDebouncedQuery('')
      setOverlayOpen(false)
    }
  }, [value])

  // Close overlay on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOverlayOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverlayOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const { data: results, isFetching } = useSearchArticles(debouncedQuery)

  const handleSelect = (slug: string) => {
    onSelect(slug)
    setValue('')
    setDebouncedQuery('')
    setOverlayOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search articles…"
          className="w-full pl-9 pr-9 py-2 text-[14px] rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent
                     transition-colors"
        />
        {/* Loading spinner */}
        {isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin"
            aria-label="Searching…"
          />
        )}
      </div>

      {/* Minimum length message */}
      {value.length === 1 && (
        <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1 px-1">
          Type at least 2 characters
        </p>
      )}

      {/* Results overlay */}
      {overlayOpen && debouncedQuery.length >= 2 && !isFetching && results !== undefined && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <HelpSearchResults
            results={results}
            searchTerm={debouncedQuery}
            onSelect={handleSelect}
            onClose={() => setOverlayOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
