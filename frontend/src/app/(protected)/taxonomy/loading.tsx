export default function TaxonomyLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-48" />
        </div>
        <div className="animate-pulse h-10 bg-gray-200 rounded w-36" />
      </div>
      <div className="flex flex-1">
        <div className="w-[320px] bg-gray-50 border-r border-gray-200 p-3">
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </div>
    </div>
  )
}
