export default function ClassificationsLoading() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="animate-pulse flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>
      <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )
}
