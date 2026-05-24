'use client'

import { useFaqs } from '@/hooks/useHelp'
import { FaqCategoryGroup } from './FaqCategoryGroup'

function FaqSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-full h-12 rounded skeleton-shimmer" />
      ))}
    </div>
  )
}

export function FaqSection() {
  const { data: faqs, isLoading, isError, refetch } = useFaqs()

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Frequently Asked Questions
        </h2>
        <FaqSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <h2 className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-[16px] text-gray-500 dark:text-gray-400">
          Unable to load FAQs —{' '}
          <button
            onClick={() => refetch()}
            className="text-[#1D4ED8] dark:text-blue-400 hover:underline"
          >
            try again
          </button>
        </p>
      </div>
    )
  }

  if (!faqs || faqs.length === 0) {
    return null
  }

  // Group FAQs by category
  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    const cat = faq.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(faq)
    return acc
  }, {})

  // Sort by displayOrder within each group
  Object.values(groups).forEach((group) =>
    group.sort((a, b) => a.displayOrder - b.displayOrder)
  )

  return (
    <section className="p-6" aria-label="Frequently asked questions">
      <h2 className="text-[14px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-6">
        Frequently Asked Questions
      </h2>
      {Object.entries(groups).map(([category, categoryFaqs]) => (
        <FaqCategoryGroup key={category} category={category} faqs={categoryFaqs} />
      ))}
    </section>
  )
}
