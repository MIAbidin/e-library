import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const filter = searchParams.get('filter') ?? 'all' // all | unread
    const type = searchParams.get('type') ?? ''        // new_book | announcement | reading_reminder
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    // Jika ada filter tipe, kita perlu join dulu ke notifications untuk filter type
    // Gunakan subquery approach: ambil notification_ids yang sesuai tipe dulu
    let query = supabase
      .from('user_notifications')
      .select(
        `
        id,
        is_read,
        read_at,
        created_at,
        notification:notifications(
          id, type, title, body, book_id, created_at,
          book:books(id, title, cover_url)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', session.user.id)

    if (filter === 'unread') {
      query = query.eq('is_read', false)
    }

    // Filter by notification type via join column
    if (type && ['new_book', 'announcement', 'reading_reminder'].includes(type)) {
      // Supabase supports filtering on joined columns
      query = (query as any).eq('notification.type', type)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    // Filter out nulls (can happen when notification join returns nothing due to type filter)
    const filtered = (data ?? []).filter((n) => n.notification !== null)

    return NextResponse.json({
      notifications: filtered,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      page,
    })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil notifikasi' },
      { status: 500 }
    )
  }
}