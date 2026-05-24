'use client'

export function HelpArticleSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-[720px]" aria-hidden="true">
      {/* Title rectangle */}
      <div className="w-64 h-7 rounded skeleton-shimmer" />

      {/* Meta row */}
      <div className="flex gap-4">
        <div className="w-24 h-4 rounded skeleton-shimmer" />
        <div className="w-32 h-4 rounded skeleton-shimmer" />
      </div>

      {/* Content block rectangles */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="w-full h-4 rounded skeleton-shimmer" />
        <div className="w-11/12 h-4 rounded skeleton-shimmer" />
        <div className="w-full h-4 rounded skeleton-shimmer" />
        <div className="w-3/4 h-4 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}

export function HelpSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-[240px] h-6 rounded skeleton-shimmer" />
      ))}
    </div>
  )
}
