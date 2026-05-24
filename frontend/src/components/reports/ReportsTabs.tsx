'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { MyReportsTab } from './MyReportsTab'
import { AdHocBuilderTab } from './AdHocBuilderTab'
import { TemplatesTab } from './TemplatesTab'

export function ReportsTabs() {
  return (
    <Tabs.Root defaultValue="my-reports" className="flex flex-col gap-0">
      {/* Tab List */}
      <Tabs.List
        className="flex gap-0 border-b border-gray-200 dark:border-gray-800"
        aria-label="Report sections"
      >
        <Tabs.Trigger
          value="my-reports"
          className="px-4 py-3 text-[16px] font-normal text-gray-500 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                     border-b-2 border-transparent
                     data-[state=active]:border-[#1D4ED8] data-[state=active]:text-gray-900
                     dark:data-[state=active]:text-white
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          My Reports
        </Tabs.Trigger>
        <Tabs.Trigger
          value="builder"
          className="px-4 py-3 text-[16px] font-normal text-gray-500 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                     border-b-2 border-transparent
                     data-[state=active]:border-[#1D4ED8] data-[state=active]:text-gray-900
                     dark:data-[state=active]:text-white
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          Ad-hoc Builder
        </Tabs.Trigger>
        <Tabs.Trigger
          value="templates"
          className="px-4 py-3 text-[16px] font-normal text-gray-500 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-gray-100 transition-colors
                     border-b-2 border-transparent
                     data-[state=active]:border-[#1D4ED8] data-[state=active]:text-gray-900
                     dark:data-[state=active]:text-white
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          Templates
        </Tabs.Trigger>
      </Tabs.List>

      {/* Tab Content */}
      <Tabs.Content value="my-reports" className="pt-6">
        <MyReportsTab />
      </Tabs.Content>
      <Tabs.Content value="builder" className="pt-6">
        <AdHocBuilderTab />
      </Tabs.Content>
      <Tabs.Content value="templates" className="pt-6">
        <TemplatesTab />
      </Tabs.Content>
    </Tabs.Root>
  )
}
