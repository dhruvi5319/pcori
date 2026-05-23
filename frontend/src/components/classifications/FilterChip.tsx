'use client'
import { X } from 'lucide-react'

interface FilterChipProps { label: string; onRemove: () => void }

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 h-[28px] px-2 rounded-full text-[14px]
                     bg-[#EFF6FF] dark:bg-[#1E3A5F40] text-[#1D4ED8] dark:text-[#3B82F6]">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`}
        className="hover:text-blue-800 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}
