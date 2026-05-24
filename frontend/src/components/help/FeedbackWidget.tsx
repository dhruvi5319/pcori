'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react'
import { useSubmitFeedback } from '@/hooks/useHelp'

type FeedbackState = 'default' | 'helpful-selected' | 'not-helpful-selected' | 'submitted'

interface FeedbackWidgetProps {
  articleId: string
}

export function FeedbackWidget({ articleId }: FeedbackWidgetProps) {
  const [state, setState] = useState<FeedbackState>('default')
  const [comment, setComment] = useState('')
  const [commentVisible, setCommentVisible] = useState(false)
  const submitFeedback = useSubmitFeedback()

  // Check localStorage for previously submitted feedback
  useEffect(() => {
    const key = `feedback-${articleId}`
    if (localStorage.getItem(key) === 'submitted') {
      setState('submitted')
    }
  }, [articleId])

  const handleThumbsUp = () => {
    setState('helpful-selected')
    setCommentVisible(true)
  }

  const handleThumbsDown = () => {
    setState('not-helpful-selected')
    setCommentVisible(true)
  }

  const handleSubmit = () => {
    const helpful = state === 'helpful-selected'
    submitFeedback.mutate(
      { articleId, helpful, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          localStorage.setItem(`feedback-${articleId}`, 'submitted')
          setState('submitted')
        },
        onError: (error: unknown) => {
          const axiosError = error as { response?: { status?: number } }
          // 409 = duplicate — treat as success
          if (axiosError.response?.status === 409) {
            localStorage.setItem(`feedback-${articleId}`, 'submitted')
            setState('submitted')
          }
          // Other errors: silently fail (don't block the user)
        },
      }
    )
  }

  // Submitted state — entire widget replaced
  if (state === 'submitted') {
    return (
      <div className="flex items-center gap-2 text-[14px] text-gray-500 dark:text-gray-400">
        <CheckCircle2 className="w-5 h-5 text-[#16A34A]" aria-hidden="true" />
        <span>Thank you for your feedback!</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="text-[16px] text-gray-700 dark:text-gray-300">Was this helpful?</span>

        {/* ThumbsUp button */}
        <button
          onClick={handleThumbsUp}
          aria-label="This article was helpful"
          className={[
            'w-11 h-11 rounded-lg flex items-center justify-center transition-colors',
            state === 'helpful-selected'
              ? 'text-[#16A34A] bg-[#DCFCE7] dark:bg-[rgba(22,163,74,0.15)]'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.08)]',
          ].join(' ')}
        >
          <ThumbsUp className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* ThumbsDown button */}
        <button
          onClick={handleThumbsDown}
          aria-label="This article was not helpful"
          className={[
            'w-11 h-11 rounded-lg flex items-center justify-center transition-colors',
            state === 'not-helpful-selected'
              ? 'text-[#DC2626] bg-[#FEE2E2] dark:bg-[rgba(220,38,38,0.15)]'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.08)]',
          ].join(' ')}
        >
          <ThumbsDown className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Expandable textarea */}
      {commentVisible && (
        <div
          className="flex flex-col gap-2"
          data-visible={commentVisible}
          style={{
            maxHeight: commentVisible ? '96px' : '0px',
            transition: 'max-height 0.2s ease',
          }}
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="w-full max-h-24 resize-none overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-[#1A1A1A] text-[14px] text-gray-900 dark:text-white
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       p-3 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent
                       transition-colors"
            rows={3}
          />

          {/* Submit feedback button */}
          <button
            onClick={handleSubmit}
            disabled={submitFeedback.isPending}
            className="self-start px-4 py-2 rounded-lg text-[14px] font-medium border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.08)]
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitFeedback.isPending ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
