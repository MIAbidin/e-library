import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/admin/notifications/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Hapus relasi dulu (foreign key safety)
    await supabase
      .from('user_notifications')
      .delete()
      .eq('notification_id', id)

    // Hapus notifikasi utama
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