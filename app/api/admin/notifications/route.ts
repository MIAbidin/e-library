import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { createAndSendNotification } from '@/lib/notifications'

// GET — riwayat pengumuman yang pernah dikirim
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    const { data, error, count } = await supabase
      .from('notifications')
      .select(`
        id, type, title, body, created_at,
        book:books(id, title),
        creator:users!created_by(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Hitung jumlah penerima per notifikasi
    const notifIds = (data ?? []).map((n) => n.id)
    const { data: recipientCounts } = await supabase
      .from('user_notifications')
      .select('notification_id')
      .in('notification_id', notifIds)

    const countMap: Record<string, number> = {}
    recipientCounts?.forEach((r) => {
      countMap[r.notification_id] = (countMap[r.notification_id] ?? 0) + 1
    })

    const result = (data ?? []).map((n) => ({
      ...n,
      recipientCount: countMap[n.id] ?? 0,
    }))

    return NextResponse.json({
      notifications: result,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      page,
    })
  } catch (error) {
    console.error('GET /api/admin/notifications error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil notifikasi' },
      { status: 500 }
    )
  }
}

// POST — kirim pengumuman baru
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, body, targetDepartment } = await request.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: 'Judul dan isi pengumuman wajib diisi' },
        { status: 400 }
      )
    }

    const result = await createAndSendNotification({
      type: 'announcement',
      title: title.trim(),
      body: body.trim(),
      createdBy: session.user.id,
      targetDepartment: targetDepartment || null,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: 'Gagal mengirim pengumuman' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        notificationId: result.notificationId,
        sentTo: result.sentTo,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/admin/notifications error:', error)
    return NextResponse.json(
      { error: 'Gagal mengirim pengumuman' },
      { status: 500 }
    )
  }
}