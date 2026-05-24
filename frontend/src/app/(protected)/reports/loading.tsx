export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-48 rounded skeleton-shimmer" />
          <div className="h-7 w-32 rounded skeleton-shimmer" />
        </div>
        <div className="h-10 w-40 rounded-lg skeleton-shimmer" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800 pb-0">
        {['My Reports', 'Ad-hoc Builder', 'Templates'].map((tab) => (
          <div key={tab} className="h-10 w-28 rounded skeleton-shimmer" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        {/* Header row */}
        <div className="flex items-center gap-4 px-4 py-3 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
          {[120, 200, 140, 120, 80].map((w, i) => (
            <div key={i} className="h-4 rounded skeleton-shimmer" style={{ width: `${w}px` }} />
          ))}
        </div>

        {/* 5 skeleton rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 border-b border-gray-100 dark:border-gray-800 bg-[#F4F6F9] dark:bg-[#141414]"
            style={{ height: '52px' }}
          >
            {[120, 200, 140, 120, 80].map((w, j) => (
              <div key={j} className="h-4 rounded skeleton-shimmer" style={{ width: `${w}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
