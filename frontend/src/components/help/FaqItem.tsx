'use client'

import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import type { Faq } from '@/types/help'

interface FaqItemProps {
  faq: Faq
}

export function FaqItem({ faq }: FaqItemProps) {
  return (
    <Accordion.Item
      value={faq.id}
      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      <Accordion.Header>
        <Accordion.Trigger
          className="flex items-center justify-between w-full py-3 px-4 text-[16px] text-gray-900 dark:text-white
                     hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left
                     focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1D4ED8]"
        >
          <span>{faq.question}</span>
          {/* ChevronRight rotates 90° when open */}
          <ChevronRight
            className="faq-chevron w-4 h-4 text-gray-400 flex-shrink-0 ml-2"
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content
        className="overflow-hidden data-[state=open]:animate-none data-[state=closed]:animate-none
                   data-[state=open]:border-l-2 data-[state=open]:border-[#1D4ED8]"
      >
        <div className="bg-[#F4F6F9] dark:bg-[#141414] p-4">
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-[1.5]">
            {faq.answer}
          </p>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}
