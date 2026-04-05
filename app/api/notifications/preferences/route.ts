import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)

    if (error) throw error

    // Pastikan semua tipe ada, tambahkan default jika belum
    const allTypes = ['new_book', 'announcement', 'reading_reminder']
    const existingTypes = new Set(data?.map((d) => d.notif_type) ?? [])

    const result = allTypes.map((type) => {
      const found = data?.find((d) => d.notif_type === type)
      return found ?? {
        id: null,
        user_id: session.user.id,
        notif_type: type,
        is_enabled: true,
      }
    })

    // Insert yang belum ada
    const missing = allTypes.filter((t) => !existingTypes.has(t))
    if (missing.length > 0) {
      await supabase.from('notification_preferences').insert(
        missing.map((t) => ({
          user_id: session.user.id,
          notif_type: t,
          is_enabled: true,
        }))
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/notifications/preferences error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil preferensi' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notifType, isEnabled } = await request.json()

    if (!notifType || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: session.user.id,
          notif_type: notifType,
          is_enabled: isEnabled,
        },
        { onConflict: 'user_id,notif_type' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notifications/preferences error:', error)
    return NextResponse.json(
      { error: 'Gagal update preferensi' },
      { status: 500 }
    )
  }
}