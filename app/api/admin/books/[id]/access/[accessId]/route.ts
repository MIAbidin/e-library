import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE /api/admin/books/[id]/access/[accessId]
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; accessId: string }> }
) {
  try {
    const { id, accessId } = await context.params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('book_access')
      .delete()
      .eq('id', accessId)
      .eq('book_id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE book access error:', err)
    return NextResponse.json({ error: 'Gagal hapus akses' }, { status: 500 })
  }
}