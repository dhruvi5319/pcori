'use client'

import { Upload, FileSearch, FileSpreadsheet, TreePine } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { UploadPlanDialog } from '@/components/classifications/UploadPlanDialog'

interface QuickActionCardProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function QuickActionCard({ icon, label, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]',
        'bg-[var(--color-surface)] p-6',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]',
        'transition-all duration-200',
        'flex flex-col items-center gap-3 w-full'
      )}
    >
      <span className="text-[var(--color-muted)] [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <span className="text-[16px] font-[400] text-[var(--color-foreground)]">{label}</span>
    </button>
  )
}

export function QuickActionsRow() {
  const router = useRouter()
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<Upload />}
          label="Upload Plan"
          onClick={() => setUploadOpen(true)}
        />
        <QuickActionCard
          icon={<FileSearch />}
          label="View Classifications"
          onClick={() => router.push('/classifications')}
        />
        <QuickActionCard
          icon={<FileSpreadsheet />}
          label="Generate Reports"
          onClick={() => router.push('/reports')}
        />
        <QuickActionCard
          icon={<TreePine />}
          label="Manage Taxonomy"
          onClick={() => router.push('/taxonomy')}
        />
      </div>

      <UploadPlanDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </>
  )
}
