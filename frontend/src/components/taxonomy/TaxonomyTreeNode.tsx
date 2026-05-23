'use client'

import { useState } from 'react'
import { ChevronRight, Tag, Folder } from 'lucide-react'
import type { TaxonomyTreeNode as TaxonomyTreeNodeType } from '@/types/taxonomy'
import { cn } from '@/lib/utils'

interface TaxonomyTreeNodeProps {
  node: TaxonomyTreeNodeType
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TaxonomyTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: TaxonomyTreeNodeProps) {
  // Root nodes expanded by default per UI-SPEC
  const [expanded, setExpanded] = useState(depth === 0)
  const c = node.category
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === c.id
  const isInactive = !c.isActive

  return (
    <li
      className="list-none"
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={isSelected}
      aria-disabled={isInactive ? true : undefined}
    >
      {/* Node row */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[14px] transition-colors',
          'hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]',
          isSelected &&
            'bg-[#EFF6FF] dark:bg-[rgba(30,58,95,0.2)] border-l-[3px] border-[#1D4ED8]',
          isInactive && 'opacity-50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(c.id)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(c.id)}
      >
        {/* Chevron — only if has children */}
        <span className="w-4 flex-shrink-0 flex items-center justify-center">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              className="p-0 hover:opacity-70 transition-opacity"
              aria-label={expanded ? 'Collapse' : 'Expand'}
              tabIndex={-1}
            >
              <ChevronRight
                className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ease"
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>
          )}
        </span>

        {/* Node icon */}
        {hasChildren ? (
          <Folder className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
        ) : (
          <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
        )}

        {/* Code + Name */}
        <span className="truncate flex-1 text-gray-900 dark:text-gray-100">
          <span className="font-mono text-[13px]">{c.code}</span>
          <span className="text-gray-500 dark:text-gray-500"> — </span>
          <span>{c.name}</span>
          {/* "(Inactive)" suffix per UI-SPEC */}
          {isInactive && (
            <span className="text-gray-400 dark:text-gray-600"> (Inactive)</span>
          )}
        </span>
      </div>

      {/* Children — CSS max-height transition per UI-SPEC */}
      {hasChildren && (
        <ul
          role="group"
          className="transition-all duration-200 ease overflow-hidden"
          style={{
            maxHeight: expanded ? '9999px' : '0px',
            opacity: expanded ? 1 : 0,
          }}
        >
          {node.children.map((child) => (
            <TaxonomyTreeNode
              key={child.category.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
