import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/admin/notifications/[id]
// Hapus notifikasi beserta semua user_notifications terkait
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

    const supabase = createAdminClient()

    // Hapus user_notifications dulu (foreign key)
    await supabase
      .from('user_notifications')
      .delete()
      .eq('notification_id', id)

    // Hapus notifikasi
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/notifications/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 })
  }
}