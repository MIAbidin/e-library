import { createAdminClient } from '@/lib/supabase/server'
import { NotificationType } from '@/types'

interface CreateNotificationOptions {
  type: NotificationType
  title: string
  body: string
  bookId?: string
  metadata?: Record<string, unknown>
  createdBy?: string
  targetDepartment?: string | null // null = semua departemen
}

export async function createAndSendNotification({
  type,
  title,
  body,
  bookId,
  metadata = {},
  createdBy,
  targetDepartment,
}: CreateNotificationOptions) {
  const supabase = createAdminClient()

  // 1. Insert ke tabel notifications
  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .insert({
      type,
      title,
      body,
      book_id: bookId ?? null,
      metadata,
      created_by: createdBy ?? null,
    })
    .select('id')
    .single()

  if (notifError || !notification) {
    console.error('Gagal insert notification:', notifError)
    return { success: false, error: notifError }
  }

  // 2. Ambil user yang punya preferensi aktif untuk tipe ini
  let userQuery = supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('notif_type', type)
    .eq('is_enabled', true)

  // Filter berdasarkan departemen jika ada
  if (targetDepartment) {
    // Ambil user IDs dari departemen tertentu dulu
    const { data: deptUsers } = await supabase
      .from('users')
      .select('id')
      .eq('department', targetDepartment)
      .eq('is_active', true)

    const deptUserIds = deptUsers?.map((u) => u.id) ?? []
    if (deptUserIds.length === 0) {
      return { success: true, notificationId: notification.id, sentTo: 0 }
    }

    userQuery = userQuery.in('user_id', deptUserIds)
  } else {
    // Semua user aktif
    const { data: activeUsers } = await supabase
      .from('users')
      .select('id')
      .eq('is_active', true)

    const activeUserIds = activeUsers?.map((u) => u.id) ?? []
    userQuery = userQuery.in('user_id', activeUserIds)
  }

  const { data: recipients } = await userQuery

  if (!recipients || recipients.length === 0) {
    return { success: true, notificationId: notification.id, sentTo: 0 }
  }

  // 3. Bulk insert ke user_notifications
  const userNotifications = recipients.map((r) => ({
    user_id: r.user_id,
    notification_id: notification.id,
    is_read: false,
  }))

  // Batch insert per 500 untuk performa
  const batchSize = 500
  for (let i = 0; i < userNotifications.length; i += batchSize) {
    const batch = userNotifications.slice(i, i + batchSize)
    const { error: insertError } = await supabase
      .from('user_notifications')
      .insert(batch)

    if (insertError) {
      console.error('Gagal insert user_notifications batch:', insertError)
    }
  }

  return {
    success: true,
    notificationId: notification.id,
    sentTo: recipients.length,
  }
}