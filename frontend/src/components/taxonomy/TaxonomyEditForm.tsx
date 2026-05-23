'use client'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { useUpdateTaxonomy } from '@/hooks/useTaxonomy'
import type { TaxonomyCategory, UpdateTaxonomyRequest } from '@/types/taxonomy'

interface TaxonomyEditFormProps {
  category: TaxonomyCategory
  onSaved: () => void
  onDiscard: () => void
}

export function TaxonomyEditForm({ category: cat, onSaved, onDiscard }: TaxonomyEditFormProps) {
  const update = useUpdateTaxonomy()
  const { register, handleSubmit, formState: { isDirty } } = useForm<UpdateTaxonomyRequest>({
    defaultValues: { code: cat.code, name: cat.name, description: cat.description ?? '', displayOrder: cat.displayOrder }
  })

  const onSubmit = async (data: UpdateTaxonomyRequest) => {
    await update.mutateAsync({ id: cat.id, data })
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h3 className="text-[16px] font-semibold">Edit: {cat.code}</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-code" className="text-[14px] text-gray-500">Code</label>
        <input id="edit-code" {...register('code')} maxLength={50}
          className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[16px]" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-name" className="text-[14px] text-gray-500">Name</label>
        <input id="edit-name" {...register('name')} required maxLength={255}
          className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[16px]" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-desc" className="text-[14px] text-gray-500">Description</label>
        <textarea id="edit-desc" {...register('description')} rows={3} maxLength={2000}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[16px] resize-none" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-order" className="text-[14px] text-gray-500">Display Order</label>
        <input id="edit-order" type="number" {...register('displayOrder', { valueAsNumber: true })}
          className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-[16px] w-32" />
      </div>

      <p className="text-[12px] text-gray-400">Parent change is not supported in Phase 2 edit flow.</p>

      <div className="flex gap-3">
        {/* Save — disabled until ≥1 field changed per UI-SPEC */}
        <button type="submit" disabled={!isDirty || update.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     disabled:opacity-50 disabled:cursor-not-allowed">
          {update.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
        </button>
        <button type="button" onClick={onDiscard}
          className="px-4 py-2 rounded-lg border border-gray-200 text-[16px] hover:bg-gray-50">
          Discard Edits
        </button>
      </div>
    </form>
  )
}
