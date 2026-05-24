export interface HelpArticle {
  id: string
  title: string
  slug: string
  category: string
  content: string     // Markdown string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface Faq {
  id: string
  question: string
  answer: string
  category: string
  displayOrder: number
  createdAt: string
}

export interface FeedbackResponse {
  id?: string
  articleId: string
  helpful: boolean
  comment?: string
  submittedAt?: string
  helpfulCount: number
  notHelpfulCount: number
}
