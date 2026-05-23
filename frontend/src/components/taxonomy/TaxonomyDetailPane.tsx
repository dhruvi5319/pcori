'use client'
import { useState } from 'react'
import { PenLine, Plus, PowerOff, Power } from 'lucide-react'
import { TreePine } from 'lucide-react'
import type { TaxonomyCategory } from '@/types/taxonomy'
import { TaxonomyEditForm } from './TaxonomyEditForm'
import { DeactivateConfirmDialog } from './DeactivateConfirmDialog'

interface TaxonomyDetailPaneProps {
  category: TaxonomyCategory | null
  onAddChild: (parentId: string) => void
  isAdmin: boolean
}

export function TaxonomyDetailPane({ category: cat, onAddChild, isAdmin }: TaxonomyDetailPaneProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  // Empty state — no node selected per UI-SPEC §Right pane — Empty state
  if (!cat) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <TreePine className="w-12 h-12 text-gray-300" />
      <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white">Select a category</h3>
      <p className="text-[16px] text-gray-500 text-center max-w-sm">
        Choose a taxonomy category from the tree to view its details and manage it.
      </p>
    </div>
  )

  // Edit mode — inline form replaces detail view per UI-SPEC
  if (isEditing) return (
    <div className="p-6">
      <TaxonomyEditForm category={cat} onSaved={() => setIsEditing(false)} onDiscard={() => setIsEditing(false)} />
    </div>
  )

  // Detail view — per UI-SPEC §Right pane — TaxonomyNodeDetail
  return (
    <div className="p-6 flex flex-col gap-4">
      {/* E2 card per UI-SPEC §Section: E2 Raised card; 24px padding */}
      <div className="p-6 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                      bg-white dark:bg-[#1A1A1A] flex flex-col gap-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[14px]
                           ${cat.isActive
                             ? 'bg-[#DCFCE7] text-[#16A34A]'
                             : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
            <span className={`w-2 h-2 rounded-full ${cat.isActive ? 'bg-[#16A34A]' : 'bg-[#6B7280]'}`} />
            {cat.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Code — Geist Mono 14px/600 per UI-SPEC */}
        <div>
          <p className="text-[14px] text-gray-500">Code</p>
          <p className="font-mono text-[14px] font-semibold">{cat.code}</p>
        </div>

        {/* Name — 24px/600 per UI-SPEC */}
        <h2 className="text-[24px] font-semibold">{cat.name}</h2>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Description */}
        {cat.description && (
          <div>
            <p className="text-[14px] text-gray-500">Description</p>
            <p className="text-[16px]">{cat.description}</p>
          </div>
        )}

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Hierarchy info */}
        <div className="flex flex-col gap-1 text-[14px] text-gray-500">
          <span>Level: {cat.level} ({(['Root/PCC', 'Category', 'Code', 'Subcode'] as const)[cat.level] ?? cat.level})</span>
          <span>Parent: {cat.parentCode ?? 'Root'}</span>
          <span>Display Order: {cat.displayOrder}</span>
        </div>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Action buttons — per UI-SPEC §Action buttons */}
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[14px] hover:bg-gray-50">
              <PenLine className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => onAddChild(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[14px] hover:bg-gray-50">
              <Plus className="w-4 h-4" /> Add Child
            </button>
            <button onClick={() => setDeactivateOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[14px]
                         ${cat.isActive
                           ? 'border-[#DC2626] text-[#DC2626] hover:bg-red-50'
                           : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {cat.isActive ? <><PowerOff className="w-4 h-4" /> Deactivate</> : <><Power className="w-4 h-4" /> Activate</>}
            </button>
          </div>
        )}
      </div>

      {/* Deactivate confirmation */}
      <DeactivateConfirmDialog
        category={cat}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
    </div>
  )
}
