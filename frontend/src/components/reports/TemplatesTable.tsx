'use client'

import { useState } from 'react'
import { Play, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { formatDistanceToNow } from 'date-fns'
import { useRunTemplate, useDeleteTemplate } from '@/hooks/useReports'
import type { ReportConfiguration } from '@/types/report'

interface TemplatesTableProps {
  templates: ReportConfiguration[]
}

function DeleteConfirmDialog({
  template,
  open,
  onOpenChange,
}: {
  template: ReportConfiguration
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteTemplate = useDeleteTemplate()

  const handleDelete = () => {
    deleteTemplate.mutate(template.id, {
      onSuccess: () => {
        toast('Template deleted')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Failed to delete template — try again')
      },
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     bg-white dark:bg-[#1A1A1A] rounded-xl shadow-2xl w-full max-w-[400px] p-6"
          aria-describedby="delete-template-description"
        >
          <Dialog.Title className="text-[24px] font-semibold text-gray-900 dark:text-white mb-3">
            Delete {template.name}?
          </Dialog.Title>
          <p
            id="delete-template-description"
            className="text-[16px] text-gray-600 dark:text-gray-300 mb-6"
          >
            This template will be deleted. You can recreate it from the ad-hoc builder.
          </p>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           transition-colors"
              >
                Keep Template
              </button>
            </Dialog.Close>
            {/* Secondary button — NOT destructive red (soft-delete per UI-SPEC) */}
            <button
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              className="px-4 py-2 text-[16px] rounded-lg border border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteTemplate.isPending ? 'Deleting…' : 'Delete Template'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const runTemplate = useRunTemplate()
  const [deleteTarget, setDeleteTarget] = useState<ReportConfiguration | null>(null)

  const handleRun = (template: ReportConfiguration) => {
    runTemplate.mutate(template.id, {
      onSuccess: () => {
        toast.success('Report generating…')
      },
      onError: () => {
        toast.error('Failed to run template — try again')
      },
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="grid" aria-label="Report Templates">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '140px' }}>
                  Created
                </th>
                <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '140px' }}>
                  Last Run
                </th>
                <th className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400" style={{ width: '120px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="group border-b border-gray-100 dark:border-gray-800
                             shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                             hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                             hover:-translate-y-[1px] hover:bg-white dark:hover:bg-[#1A1A1A]
                             bg-[#F4F6F9] dark:bg-[#141414]
                             transition-all duration-150 ease-out"
                  style={{ height: '52px' }}
                >
                  <td className="px-4 py-0">
                    <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                  </td>
                  <td className="px-4 py-0 w-[140px]">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400">
                      {formatDate(template.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-0 w-[140px]">
                    <span className="text-[14px] text-gray-500 dark:text-gray-400">
                      {template.updatedAt ? formatDate(template.updatedAt) : '—'}
                    </span>
                  </td>
                  {/* Actions — fade in on hover (same pattern as ClassificationRow) */}
                  <td className="px-4 py-0 w-[120px]">
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      role="group"
                      aria-label={`Actions for ${template.name}`}
                    >
                      <button
                        onClick={() => handleRun(template)}
                        disabled={runTemplate.isPending}
                        aria-label={`Run ${template.name}`}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Open edit dialog — deferred to Phase 4 edit flow
                        }}
                        aria-label={`Edit ${template.name}`}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(template)}
                        aria-label={`Delete ${template.name}`}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          template={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </>
  )
}
