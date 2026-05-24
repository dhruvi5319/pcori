'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTaxonomyTree, useCreateTaxonomy } from '@/hooks/useTaxonomy'
import type { CreateTaxonomyRequest, TaxonomyCategory, TaxonomyTreeNode } from '@/types/taxonomy'

interface TaxonomyAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultParentId?: string
}

function flattenTree(nodes: TaxonomyTreeNode[]): TaxonomyCategory[] {
  const result: TaxonomyCategory[] = []
  const traverse = (nodeList: TaxonomyTreeNode[]) => {
    for (const n of nodeList) {
      result.push(n.category)
      traverse(n.children)
    }
  }
  traverse(nodes)
  return result
}

export function TaxonomyAddDialog({
  open,
  onOpenChange,
  defaultParentId,
}: TaxonomyAddDialogProps) {
  const { data: tree } = useTaxonomyTree()
  const create = useCreateTaxonomy()
  const { register, handleSubmit, watch, reset } = useForm<CreateTaxonomyRequest>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      parentId: defaultParentId ?? '',
      level: defaultParentId ? 1 : 0,
      displayOrder: 0,
    },
  })

  const flatCategories = tree ? flattenTree(tree) : []

  const watchedCode = watch('code')
  const watchedParentId = watch('parentId')
  const selectedParent = flatCategories.find((c) => c.id === watchedParentId)

  // Live breadcrumb preview per UI-SPEC §HierarchyBreadcrumbPreview
  const breadcrumb = [
    'Root',
    ...(selectedParent ? [selectedParent.name] : []),
    watchedCode || '(enter a code)',
  ].join(' > ')

  const onSubmit = async (data: CreateTaxonomyRequest) => {
    // Auto-calculate level from parent
    const level = selectedParent ? selectedParent.level + 1 : 0
    await create.mutateAsync({ ...data, level, parentId: data.parentId || undefined })
    reset()
    onOpenChange(false)
  }

  const handleClose = () => {
    if (!create.isPending) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#141414] rounded-xl p-6 w-full max-w-[600px]
                     shadow-[0_8px_32px_rgba(0,0,0,0.12)] focus:outline-none"
          aria-describedby="add-taxonomy-description"
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white">
              Add Taxonomy Category
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                disabled={create.isPending}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <p id="add-taxonomy-description" className="sr-only">
            Create a new taxonomy category in the PCORI hierarchy
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Code + Display Order row */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label
                  htmlFor="add-code"
                  className="text-[14px] text-gray-500 dark:text-gray-400"
                >
                  Code <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="add-code"
                  {...register('code', { required: true })}
                  maxLength={50}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-[16px] font-mono
                             focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <div className="flex flex-col gap-1 w-28">
                <label
                  htmlFor="add-order"
                  className="text-[14px] text-gray-500 dark:text-gray-400"
                >
                  Order
                </label>
                <input
                  id="add-order"
                  type="number"
                  {...register('displayOrder', { valueAsNumber: true })}
                  className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-[16px]
                             focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="add-name" className="text-[14px] text-gray-500 dark:text-gray-400">
                Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="add-name"
                {...register('name', { required: true })}
                maxLength={255}
                className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-[16px]
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-parent"
                className="text-[14px] text-gray-500 dark:text-gray-400"
              >
                Parent Category
              </label>
              <select
                id="add-parent"
                {...register('parentId')}
                className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-[16px]
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              >
                <option value="">None (Root)</option>
                {flatCategories
                  .filter((c) => c.isActive && c.level < 3)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="add-desc" className="text-[14px] text-gray-500 dark:text-gray-400">
                Description
              </label>
              <textarea
                id="add-desc"
                {...register('description')}
                rows={3}
                maxLength={2000}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-[16px] resize-none
                           focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            {/* Live breadcrumb preview — UI-SPEC §HierarchyBreadcrumbPreview */}
            <div className="p-3 rounded-lg bg-[#F4F6F9] dark:bg-[#1A1A1A]">
              <p className="text-[12px] text-gray-400 mb-1">Hierarchy Preview</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 truncate">{breadcrumb}</p>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={create.isPending}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             text-[16px] hover:bg-gray-50 dark:hover:bg-gray-800
                             disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={create.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                           bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                           disabled:opacity-50 hover:enabled:brightness-110 transition-all"
              >
                {create.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add Category
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
