'use client'

import { X } from 'lucide-react'

interface FilterChipProps {
  label: string
  onRemove: () => void
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 h-[28px] px-2 rounded-full text-[14px]
                 bg-[#EFF6FF] dark:bg-[rgba(30,58,95,0.4)] text-[#1D4ED8] dark:text-[#3B82F6]
                 border border-[#BFDBFE] dark:border-[rgba(59,130,246,0.3)]"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="hover:text-blue-800 dark:hover:text-blue-300 transition-colors ml-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}
