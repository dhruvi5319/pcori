'use client'

import { useTaxonomyTree } from '@/hooks/useTaxonomy'
import { TaxonomyTreeNode } from './TaxonomyTreeNode'

interface TaxonomyTreeProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TaxonomyTree({ selectedId, onSelect }: TaxonomyTreeProps) {
  const { data: tree, isLoading } = useTaxonomyTree()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!tree || tree.length === 0) {
    return (
      <p className="p-4 text-[14px] text-gray-400 text-center">No taxonomy categories found.</p>
    )
  }

  return (
    <ul role="tree" className="p-2 flex flex-col gap-0.5" aria-label="Taxonomy category tree">
      {tree.map((node) => (
        <TaxonomyTreeNode
          key={node.category.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
