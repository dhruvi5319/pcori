'use client'

import ReactMarkdown from 'react-markdown'
import { useArticle } from '@/hooks/useHelp'
import { HelpArticleSkeleton } from './HelpArticleSkeleton'
import { FeedbackWidget } from './FeedbackWidget'
import type { HelpArticle } from '@/types/help'

interface HelpArticleViewProps {
  slug: string | null
}

function ArticleContent({ article }: { article: HelpArticle }) {
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className="flex flex-col gap-6 p-6">
      {/* Article header */}
      <div>
        <div className="flex items-center gap-2 text-[14px] text-gray-500 dark:text-gray-400 mb-2">
          <span>{article.category}</span>
          <span>·</span>
          <span>Published {publishedDate}</span>
        </div>
        <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white">
          {article.title}
        </h1>
      </div>

      {/* Markdown body — max-w-[720px] for optimal reading line length */}
      <div
        className="max-w-[720px] prose-container text-[16px] text-gray-700 dark:text-gray-300"
        style={{ lineHeight: '1.6' }}
      >
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white mt-6 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 text-[16px] leading-[1.6] text-gray-700 dark:text-gray-300">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-[16px] leading-[1.6] text-gray-700 dark:text-gray-300">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-')
              if (isBlock) {
                return (
                  <code
                    className={[
                      className,
                      'block font-mono text-[14px] bg-[#F4F6F9] dark:bg-[#1A1A1A] rounded-md p-4 overflow-x-auto',
                    ].join(' ')}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <code className="font-mono text-[14px] bg-[#F4F6F9] dark:bg-[#1A1A1A] rounded px-1.5 py-0.5">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="mb-4 rounded-md overflow-hidden">{children}</pre>
            ),
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Feedback widget */}
      <div className="mt-2 pt-6 border-t border-gray-100 dark:border-gray-800">
        <FeedbackWidget articleId={article.id} />
      </div>
    </article>
  )
}

export function HelpArticleView({ slug }: HelpArticleViewProps) {
  const { data: article, isLoading, isError, refetch } = useArticle(slug)

  if (!slug) {
    return null
  }

  if (isLoading) {
    return <HelpArticleSkeleton />
  }

  if (isError || !article) {
    return (
      <div className="p-6 text-[16px] text-gray-500 dark:text-gray-400">
        Unable to load article —{' '}
        <button
          onClick={() => refetch()}
          className="text-[#1D4ED8] dark:text-blue-400 hover:underline"
        >
          try again
        </button>
      </div>
    )
  }

  return <ArticleContent article={article} />
}
