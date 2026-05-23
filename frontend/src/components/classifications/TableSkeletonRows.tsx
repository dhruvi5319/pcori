export function TableSkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[100px]" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[200px]" /></td>
          <td className="px-4 py-3"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-[100px]" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[120px]" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[50px]" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[80px]" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-[60px]" /></td>
        </tr>
      ))}
    </>
  )
}
