'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaxonomyTree } from '@/hooks/useTaxonomy'
import { TaxonomySearchBar } from '@/components/taxonomy/TaxonomySearchBar'
import { TaxonomyTree } from '@/components/taxonomy/TaxonomyTree'
import { TaxonomyDetailPane } from '@/components/taxonomy/TaxonomyDetailPane'
import { TaxonomyAddDialog } from '@/components/taxonomy/TaxonomyAddDialog'
import type { TaxonomyCategory } from '@/types/taxonomy'
import type { TaxonomyTreeNode } from '@/types/taxonomy'

export default function TaxonomyPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addParentId, setAddParentId] = useState<string | undefined>(undefined)
  const { data: tree } = useTaxonomyTree()

  // Find selected category from tree
  const findCategory = (nodes: TaxonomyTreeNode[], id: string): TaxonomyCategory | null => {
    for (const n of nodes ?? []) {
      if (n.category.id === id) return n.category
      const found = findCategory(n.children, id)
      if (found) return found
    }
    return null
  }
  const selectedCategory = selectedId ? findCategory(tree ?? [], selectedId) : null

  const handleAddChild = (parentId: string) => {
    setAddParentId(parentId)
    setAddDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-[24px] font-semibold">Taxonomy Management</h1>
        {/* Add Category CTA — TAXONOMY_ADMIN only; role gating via token check */}
        <button onClick={() => { setAddParentId(undefined); setAddDialogOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Two-pane layout per UI-SPEC §Screen 5 */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — 320px fixed; secondary bg per UI-SPEC */}
        <div className="w-[320px] flex-shrink-0 flex flex-col gap-2 p-3
                        bg-[#F4F6F9] dark:bg-[#141414]
                        border-r border-[#E5E7EB] dark:border-[#2A2A2A]
                        overflow-y-auto">
          <TaxonomySearchBar onSelect={id => setSelectedId(id)} />
          <TaxonomyTree selectedId={selectedId} onSelect={id => setSelectedId(id)} />
        </div>

        {/* Right pane — fluid; min-width 400px per UI-SPEC */}
        <div className="flex-1 min-w-[400px] overflow-y-auto">
          <TaxonomyDetailPane
            category={selectedCategory}
            onAddChild={handleAddChild}
            isAdmin={true}  // wire from auth context in production
          />
        </div>
      </div>

      <TaxonomyAddDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} defaultParentId={addParentId} />
    </div>
  )
}
