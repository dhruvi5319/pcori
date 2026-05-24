'use client'

export function UsersTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr
          key={i}
          className="border-b border-gray-100 dark:border-gray-800 bg-[#F4F6F9] dark:bg-[#141414]"
          style={{ height: '52px' }}
        >
          <td className="px-4 py-0">
            <div className="h-4 w-20 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-0">
            <div className="h-4 w-40 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-0">
            <div className="h-4 w-32 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-0">
            <div className="flex gap-1">
              <div className="h-6 w-12 rounded skeleton-shimmer" />
            </div>
          </td>
          <td className="px-4 py-0">
            <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          </td>
          <td className="px-4 py-0">
            <div className="h-4 w-20 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-0">
            <div className="h-6 w-6 rounded skeleton-shimmer" />
          </td>
        </tr>
      ))}
    </>
  )
}
