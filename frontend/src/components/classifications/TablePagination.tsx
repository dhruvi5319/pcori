interface TablePaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPage: (page: number) => void
}

export function TablePagination({
  page,
  totalPages,
  totalElements,
  size,
  onPage,
}: TablePaginationProps) {
  const start = page * size + 1
  const end = Math.min((page + 1) * size, totalElements)

  return (
    <div className="flex items-center justify-between px-4 h-[44px] border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414]">
      <span className="text-[14px] text-gray-500 dark:text-gray-400">
        Showing {start}–{end} of {totalElements}
      </span>
      <div className="flex items-center gap-3">
        <button
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="text-[14px] disabled:opacity-40 hover:text-[#1D4ED8] dark:hover:text-[#3B82F6] transition-colors disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          ← Previous
        </button>
        <span className="text-[14px] text-gray-500 dark:text-gray-400">
          Page {page + 1} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
          className="text-[14px] disabled:opacity-40 hover:text-[#1D4ED8] dark:hover:text-[#3B82F6] transition-colors disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
