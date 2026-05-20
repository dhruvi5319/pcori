export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ErrorResponse {
  type: string
  title: string
  status: number
  detail: string
  timestamp: string
  errors?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}
