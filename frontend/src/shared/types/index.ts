export type UserRole = 'SUPER_USER' | 'STATE_ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

// API Response types
export interface ApiResponse<T> {
  code: string
  status: string
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}
