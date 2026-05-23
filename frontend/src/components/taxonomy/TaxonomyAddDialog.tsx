'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTaxonomyTree, useCreateTaxonomy } from '@/hooks/useTaxonomy'
import type { CreateTaxonomyRequest, TaxonomyCategory } from '@/types/taxonomy'
import type { TaxonomyTreeNode } from '@/types/taxonomy'

interface TaxonomyAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultParentId?: string
}

export function TaxonomyAddDialog({ open, onOpenChange, defaultParentId }: TaxonomyAddDialogProps) {
  const { data: tree } = useTaxonomyTree()
  const create = useCreateTaxonomy()
  const { register, handleSubmit, watch, reset } = useForm<CreateTaxonomyRequest>({
    defaultValues: { code: '', name: '', description: '', parentId: defaultParentId, level: defaultParentId ? 1 : 0, displayOrder: 0 }
  })

  // Flatten tree for parent selector
  const flatCategories: TaxonomyCategory[] = []
  const flatten = (nodes: TaxonomyTreeNode[]) => nodes?.forEach(n => { flatCategories.push(n.category); flatten(n.children) })
  if (tree) flatten(tree)

  const watchedCode = watch('code')
  const watchedParentId = watch('parentId')
  const selectedParent = flatCategories.find(c => c.id === watchedParentId)

  // Live breadcrumb preview per UI-SPEC §HierarchyBreadcrumbPreview
  const breadcrumb = [
    'Root',
    ...(selectedParent ? [selectedParent.name] : []),
    watchedCode || '(enter a code)',
  ].join(' > ')

  const onSubmit = async (data: CreateTaxonomyRequest) => {
    // Auto-calculate level
    const level = selectedParent ? selectedParent.level + 1 : 0
    await create.mutateAsync({ ...data, level })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Content
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                   bg-white dark:bg-[#141414] rounded-xl p-6 w-full max-w-[600px]
                   shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-center justify-between mb-6">
          <Dialog.Title className="text-[24px] font-semibold">Add Taxonomy Category</Dialog.Title>
          <Dialog.Close asChild>
            <button aria-label="Close"><X className="w-5 h-5" /></button>
          </Dialog.Close>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="add-code" className="text-[14px] text-gray-500">Code *</label>
              <input id="add-code" {...register('code', { required: true })} maxLength={50}
                className="h-9 px-3 rounded-lg border border-gray-200 text-[16px]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="add-order" className="text-[14px] text-gray-500">Display Order</label>
              <input id="add-order" type="number" {...register('displayOrder', { valueAsNumber: true })}
                className="h-9 px-3 rounded-lg border border-gray-200 text-[16px]" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="add-name" className="text-[14px] text-gray-500">Name *</label>
            <input id="add-name" {...register('name', { required: true })} maxLength={255}
              className="h-9 px-3 rounded-lg border border-gray-200 text-[16px]" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="add-parent" className="text-[14px] text-gray-500">Parent Category</label>
            <select id="add-parent" {...register('parentId')}
              className="h-9 px-3 rounded-lg border border-gray-200 text-[16px] bg-white dark:bg-gray-900">
              <option value="">None (Root)</option>
              {flatCategories.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="add-desc" className="text-[14px] text-gray-500">Description</label>
            <textarea id="add-desc" {...register('description')} rows={3} maxLength={2000}
              className="px-3 py-2 rounded-lg border border-gray-200 text-[16px] resize-none" />
          </div>

          {/* Live breadcrumb preview — 14px/400 muted; truncated per UI-SPEC */}
          <div className="p-3 rounded-lg bg-[#F4F6F9] dark:bg-[#141414]">
            <p className="text-[12px] text-gray-400 mb-1">Hierarchy Preview</p>
            <p className="text-[14px] text-gray-500 truncate">{breadcrumb}</p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Dialog.Close asChild>
              <button type="button" className="px-4 py-2 rounded-lg border border-gray-200 text-[16px]">Cancel</button>
            </Dialog.Close>
            <button type="submit" disabled={create.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                         bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                         disabled:opacity-50">
              {create.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Plus className="w-4 h-4" /> Add Category</>}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
