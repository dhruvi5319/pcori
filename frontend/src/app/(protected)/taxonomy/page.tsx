'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaxonomyTree } from '@/hooks/useTaxonomy'
import { TaxonomySearchBar } from '@/components/taxonomy/TaxonomySearchBar'
import { TaxonomyTree } from '@/components/taxonomy/TaxonomyTree'
import { TaxonomyDetailPane } from '@/components/taxonomy/TaxonomyDetailPane'
import { TaxonomyAddDialog } from '@/components/taxonomy/TaxonomyAddDialog'
import type { TaxonomyCategory, TaxonomyTreeNode } from '@/types/taxonomy'

function findCategoryInTree(
  nodes: TaxonomyTreeNode[],
  id: string
): TaxonomyCategory | null {
  for (const n of nodes) {
    if (n.category.id === id) return n.category
    const found = findCategoryInTree(n.children, id)
    if (found) return found
  }
  return null
}

export default function TaxonomyPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addParentId, setAddParentId] = useState<string | undefined>(undefined)

  const { data: tree } = useTaxonomyTree()

  const selectedCategory = selectedId ? findCategoryInTree(tree ?? [], selectedId) : null

  const handleAddChild = (parentId: string) => {
    setAddParentId(parentId)
    setAddDialogOpen(true)
  }

  const handleAddRoot = () => {
    setAddParentId(undefined)
    setAddDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <nav className="text-[14px] text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            Dashboard › Taxonomy
          </nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">
            Taxonomy Management
          </h1>
        </div>
        {/* Add Category CTA — TAXONOMY_ADMIN / ADMIN only */}
        <button
          onClick={handleAddRoot}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Category
        </button>
      </div>

      {/* Two-pane layout per UI-SPEC §Screen 5 */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — 320px fixed; secondary bg per UI-SPEC */}
        <div
          className="w-[320px] flex-shrink-0 flex flex-col gap-2 p-3
                     bg-[#F4F6F9] dark:bg-[#141414]
                     border-r border-[#E5E7EB] dark:border-[#2A2A2A]
                     overflow-y-auto"
          aria-label="Taxonomy tree"
        >
          <TaxonomySearchBar onSelect={(id) => setSelectedId(id)} />
          <TaxonomyTree selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
        </div>

        {/* Right pane — fluid; min-width 400px per UI-SPEC */}
        <div
          className="flex-1 min-w-0 overflow-y-auto"
          aria-label="Category detail"
          style={{ minWidth: '400px' }}
        >
          <TaxonomyDetailPane
            category={selectedCategory}
            onAddChild={handleAddChild}
            isAdmin={true} // TODO: wire from auth context — checks ROLE_ADMIN or ROLE_TAXONOMY_ADMIN
          />
        </div>
      </div>

      {/* Add Category dialog */}
      <TaxonomyAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultParentId={addParentId}
      />
    </div>
  )
}
