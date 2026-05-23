'use client'
import { useTaxonomyTree } from '@/hooks/useTaxonomy'
import { TaxonomyTreeNode } from './TaxonomyTreeNode'

interface TaxonomyTreeProps { selectedId: string | null; onSelect: (id: string) => void }

export function TaxonomyTree({ selectedId, onSelect }: TaxonomyTreeProps) {
  const { data: tree, isLoading } = useTaxonomyTree()

  if (isLoading) return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  )

  return (
    <ul role="tree" className="p-2 flex flex-col gap-0.5">
      {tree?.map(node => (
        <TaxonomyTreeNode key={node.category.id} node={node} depth={0}
          selectedId={selectedId} onSelect={onSelect} />
      ))}
    </ul>
  )
}
