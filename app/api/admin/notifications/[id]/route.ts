import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/admin/notifications/[id]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Ambil params (WAJIB pakai await)
    const { id } = await context.params

    // ✅ Validasi ID (hindari error UUID undefined)
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'ID tidak valid' },
        { status: 400 }
      )
    }

    // ✅ Validasi session admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // ✅ Hapus relasi dulu (hindari foreign key error)
    const { error: relError } = await supabase
      .from('user_notifications')
      .delete()
      .eq('notification_id', id)

    if (relError) throw relError

    // ✅ Hapus notifikasi utama
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/notifications/[id] error:', error)

    return NextResponse.json(
      { error: 'Gagal menghapus notifikasi' },
      { status: 500 }
    )
  }
}