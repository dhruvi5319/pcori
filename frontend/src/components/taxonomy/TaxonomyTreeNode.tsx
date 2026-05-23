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

export function TaxonomyTreeNode({ node, depth, selectedId, onSelect }: TaxonomyTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)  // root nodes expanded by default per UI-SPEC
  const c = node.category
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === c.id
  const isInactive = !c.isActive

  return (
    <li className="list-none" role="treeitem" aria-expanded={hasChildren ? expanded : undefined}
        aria-disabled={isInactive ? true : undefined}>
      {/* Node row */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-[14px]',
          'hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]',
          isSelected && 'bg-[#EFF6FF] dark:bg-[#1E3A5F20] border-l-[3px] border-[#1D4ED8]',
          isInactive && 'opacity-50',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(c.id)}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onSelect(c.id)}
      >
        {/* Chevron — only if has children; placeholder space if leaf */}
        <span className="w-4 flex-shrink-0">
          {hasChildren && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
              className="p-0 hover:opacity-70"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {/* Chevron rotation 0→90deg per UI-SPEC §Tree node expand/collapse */}
              <ChevronRight
                className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ease"
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>
          )}
        </span>

        {/* Node icon: Folder for levels 0-1, Tag for leaves */}
        {hasChildren
          ? <Folder className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          : <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        }

        {/* Code + Name */}
        <span className="truncate flex-1">
          <span className="font-mono">{c.code}</span>
          <span className="text-gray-500"> — </span>
          <span>{c.name}</span>
          {/* "(Inactive)" suffix per UI-SPEC */}
          {isInactive && <span className="text-gray-400"> (Inactive)</span>}
        </span>
      </div>

      {/* Children — CSS max-height transition per UI-SPEC §Tree node expand/collapse animation */}
      {hasChildren && (
        <ul
          role="group"
          className="transition-all duration-200 ease overflow-hidden"
          style={{ maxHeight: expanded ? '9999px' : '0', opacity: expanded ? 1 : 0 }}
        >
          {/* Indent line connector */}
          <div className="relative" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E5E7EB] dark:bg-[#2A2A2A]" style={{ left: `${depth * 16 + 16}px` }} />
          </div>
          {node.children.map(child => (
            <TaxonomyTreeNode key={child.category.id} node={child}
              depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  )
}
