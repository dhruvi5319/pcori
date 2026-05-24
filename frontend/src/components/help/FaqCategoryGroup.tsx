'use client'

import * as Accordion from '@radix-ui/react-accordion'
import type { Faq } from '@/types/help'
import { FaqItem } from './FaqItem'

interface FaqCategoryGroupProps {
  category: string
  faqs: Faq[]
}

export function FaqCategoryGroup({ category, faqs }: FaqCategoryGroupProps) {
  return (
    <div className="mb-6">
      {/* Category heading */}
      <h3 className="text-[16px] uppercase text-gray-500 dark:text-gray-400 px-4 py-2">
        {category}
      </h3>

      {/* Radix Accordion — type="single" collapsible: one open at a time per group */}
      <Accordion.Root type="single" collapsible className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {faqs.map((faq) => (
          <FaqItem key={faq.id} faq={faq} />
        ))}
      </Accordion.Root>
    </div>
  )
}
