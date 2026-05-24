'use client'

import { useState } from 'react'
import { PenLine, Plus, PowerOff, Power, TreePine } from 'lucide-react'
import type { TaxonomyCategory } from '@/types/taxonomy'
import { TaxonomyEditForm } from './TaxonomyEditForm'
import { DeactivateConfirmDialog } from './DeactivateConfirmDialog'

interface TaxonomyDetailPaneProps {
  category: TaxonomyCategory | null
  onAddChild: (parentId: string) => void
  isAdmin: boolean
}

const LEVEL_LABELS = ['Root/PCC', 'Category', 'Code', 'Subcode']

export function TaxonomyDetailPane({
  category: cat,
  onAddChild,
  isAdmin,
}: TaxonomyDetailPaneProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  // Reset edit mode when selected category changes
  const prevId = useState<string | null>(null)

  // Empty state — no node selected per UI-SPEC
  if (!cat) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <TreePine className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <h3 className="text-[24px] font-semibold text-gray-900 dark:text-white">
          Select a category
        </h3>
        <p className="text-[16px] text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Choose a taxonomy category from the tree to view its details and manage it.
        </p>
      </div>
    )
  }

  // Edit mode — inline form replaces detail view per UI-SPEC
  if (isEditing) {
    return (
      <div className="p-6">
        <TaxonomyEditForm
          category={cat}
          onSaved={() => setIsEditing(false)}
          onDiscard={() => setIsEditing(false)}
        />
      </div>
    )
  }

  // Detail view
  return (
    <div className="p-6 flex flex-col gap-4">
      {/* E2 card per UI-SPEC §Section: E2 Raised card */}
      <div
        className="p-6 rounded-xl bg-white dark:bg-[#1A1A1A]
                   shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                   flex flex-col gap-4"
      >
        {/* Active / Inactive badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[14px]
                       ${
                         cat.isActive
                           ? 'bg-[#DCFCE7] dark:bg-[rgba(22,163,74,0.15)] text-[#16A34A] dark:text-[#4ADE80]'
                           : 'bg-[#F3F4F6] dark:bg-[rgba(107,114,128,0.15)] text-[#6B7280] dark:text-[#9CA3AF]'
                       }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${cat.isActive ? 'bg-[#16A34A]' : 'bg-[#6B7280]'}`}
            />
            {cat.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Code — Geist Mono 14px/600 per UI-SPEC */}
        <div>
          <p className="text-[14px] text-gray-500 dark:text-gray-400">Code</p>
          <p className="font-mono text-[14px] font-semibold text-gray-900 dark:text-gray-100">
            {cat.code}
          </p>
        </div>

        {/* Name — 24px/600 per UI-SPEC */}
        <h2 className="text-[24px] font-semibold text-gray-900 dark:text-white">{cat.name}</h2>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Description */}
        {cat.description && (
          <div>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">Description</p>
            <p className="text-[16px] text-gray-700 dark:text-gray-300">{cat.description}</p>
          </div>
        )}

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* Hierarchy info */}
        <div className="flex flex-col gap-1 text-[14px] text-gray-500 dark:text-gray-400">
          <span>
            Level: {cat.level} ({LEVEL_LABELS[cat.level] ?? `Level ${cat.level}`})
          </span>
          <span>Parent: {cat.parentCode ?? 'Root'}</span>
          <span>Display Order: {cat.displayOrder}</span>
        </div>

        {/* Action buttons — shown for TAXONOMY_ADMIN / ADMIN */}
        {isAdmin && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                           text-[14px] text-gray-700 dark:text-gray-200
                           hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <PenLine className="w-4 h-4" aria-hidden="true" />
                Edit
              </button>
              {cat.level < 3 && (
                <button
                  onClick={() => onAddChild(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                             text-[14px] text-gray-700 dark:text-gray-200
                             hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Child
                </button>
              )}
              <button
                onClick={() => setDeactivateOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[14px] transition-colors
                           ${
                             cat.isActive
                               ? 'border-[#DC2626] text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-900/10'
                               : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                           }`}
              >
                {cat.isActive ? (
                  <>
                    <PowerOff className="w-4 h-4" aria-hidden="true" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" aria-hidden="true" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Deactivate confirmation dialog */}
      <DeactivateConfirmDialog
        category={cat}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
    </div>
  )
}
