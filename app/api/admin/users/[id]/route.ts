import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// GET — detail user + statistik aktivitas
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, avatar_url, is_active, last_login_at, created_at')
      .eq('id', id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const { count: booksRead } = await supabase
      .from('read_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    const { data: pagesData } = await supabase
      .from('reading_sessions')
      .select('end_page, start_page')
      .eq('user_id', id)

    const totalPages =
      pagesData?.reduce(
        (sum, s) => sum + Math.max(0, (s.end_page ?? 0) - (s.start_page ?? 0)),
        0
      ) ?? 0

    const { count: booksCompleted } = await supabase
      .from('book_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    return NextResponse.json({
      ...user,
      stats: {
        booksRead: booksRead ?? 0,
        totalPagesRead: totalPages,
        booksCompleted: booksCompleted ?? 0,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}

// PUT — update profil user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, department, role, is_active } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
    }

    if (id === session.user.id) {
      if (role && role !== session.user.role) {
        return NextResponse.json(
          { error: 'Tidak bisa mengubah role akun sendiri' },
          { status: 400 }
        )
      }
      if (is_active === false) {
        return NextResponse.json(
          { error: 'Tidak bisa menonaktifkan akun sendiri' },
          { status: 400 }
        )
      }
    }

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      department: department?.trim() || null,
    }

    if (role !== undefined) updateData.role = role
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, department, is_active, last_login_at, created_at')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate user' },
      { status: 500 }
    )
  }
}

// DELETE — hapus user permanen
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Tidak bisa menghapus akun sendiri' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    await Promise.allSettled([
      supabase.from('read_history').delete().eq('user_id', id),
      supabase.from('reading_sessions').delete().eq('user_id', id),
      supabase.from('book_completions').delete().eq('user_id', id),
      supabase.from('daily_read_stats').delete().eq('user_id', id),
      supabase.from('user_notifications').delete().eq('user_id', id),
      supabase.from('notification_preferences').delete().eq('user_id', id),
      supabase.from('book_access').delete().eq('user_id', id),
    ])

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}