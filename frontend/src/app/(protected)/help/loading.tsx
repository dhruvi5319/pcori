import { HelpArticleSkeleton, HelpSidebarSkeleton } from '@/components/help/HelpArticleSkeleton'

export default function HelpLoading() {
  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar skeleton */}
      <div
        className="w-[240px] flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#2A2A2A]
                   bg-[#F4F6F9] dark:bg-[#141414]"
      >
        <HelpSidebarSkeleton />
      </div>

      {/* Article skeleton */}
      <div className="flex-1 overflow-y-auto">
        <HelpArticleSkeleton />
      </div>
    </div>
  )
}
