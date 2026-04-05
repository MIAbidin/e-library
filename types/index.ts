export type UserRole = 'admin' | 'karyawan'

export interface User {
  id: string
  name: string
  email: string
  password_hash?: string
  role: UserRole
  department: string | null
  avatar_url: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  description: string | null
  year: number | null
  total_pages: number
  file_url: string
  cover_url: string | null
  category_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
}

export interface ReadHistory {
  id: string
  user_id: string
  book_id: string
  last_page: number
  last_read_at: string
}

// Untuk session NextAuth (extend default)
export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  avatar_url: string | null
  is_active: boolean
}

export type NotificationType = 'new_book' | 'announcement' | 'reading_reminder'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  book_id: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export interface UserNotification {
  id: string
  user_id: string
  notification_id: string
  is_read: boolean
  read_at: string | null
  created_at: string
  notification: Notification & {
    book?: {
      id: string
      title: string
      cover_url: string | null
    } | null
  }
}

export interface NotificationPreference {
  id: string
  user_id: string
  notif_type: NotificationType
  is_enabled: boolean
}