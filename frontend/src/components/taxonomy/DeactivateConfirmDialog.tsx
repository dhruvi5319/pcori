'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { useSetTaxonomyStatus, useTaxonomyTree } from '@/hooks/useTaxonomy'
import type { TaxonomyCategory } from '@/types/taxonomy'
import type { TaxonomyTreeNode } from '@/types/taxonomy'

interface DeactivateConfirmDialogProps {
  category: TaxonomyCategory
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateConfirmDialog({ category: cat, open, onOpenChange }: DeactivateConfirmDialogProps) {
  const setStatus = useSetTaxonomyStatus()
  const { data: tree } = useTaxonomyTree()

  // Count descendant children affected
  const countDescendants = (nodes: TaxonomyTreeNode[], targetId: string): number => {
    for (const n of nodes ?? []) {
      if (n.category.id === targetId) {
        const count = (node: TaxonomyTreeNode): number => node.children.reduce((acc: number, c: TaxonomyTreeNode) => acc + 1 + count(c), 0)
        return count(n)
      }
      const found = countDescendants(n.children, targetId)
      if (found >= 0) return found
    }
    return -1
  }
  const childCount = tree ? Math.max(0, countDescendants(tree, cat.id)) : 0
  const isActivating = !cat.isActive

  const handleAction = async () => {
    await setStatus.mutateAsync({ id: cat.id, isActive: isActivating })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                                  bg-white dark:bg-[#141414] rounded-xl p-6 max-w-[480px] w-full
                                  shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <Dialog.Title className="text-[24px] font-semibold mb-4">
          {isActivating ? `Activate ${cat.code}?` : `Deactivate ${cat.code}?`}
        </Dialog.Title>
        <div className="flex flex-col gap-2 mb-6 text-[16px] text-gray-600 dark:text-gray-400">
          {isActivating ? (
            <p>This code will be available for future classifications.</p>
          ) : (
            <>
              <p>This code will be hidden from future classifications. Existing records using it will not be affected.</p>
              {/* Cascade warning — per UI-SPEC §DeactivateConfirmDialog */}
              {childCount > 0 && (
                <p className="text-[#D97706] font-medium">{childCount} child code{childCount > 1 ? 's' : ''} will also be deactivated.</p>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Dialog.Close asChild>
            {/* Dismiss button defaults focus per UI-SPEC accessibility */}
            <button autoFocus className="px-4 py-2 rounded-lg border border-gray-200 text-[16px]">
              {isActivating ? 'Cancel' : 'Keep Active'}
            </button>
          </Dialog.Close>
          {/* Destructive red button per UI-SPEC — NOT gradient */}
          <button onClick={handleAction} disabled={setStatus.isPending}
            className="px-4 py-2 rounded-lg text-white text-[16px]
                       bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 transition-colors">
            {isActivating ? 'Activate' : 'Deactivate'}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
