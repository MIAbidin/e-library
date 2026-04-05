import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ count: 0 })
    }

    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ count: count ?? 0 })
  } catch (error) {
    console.error('GET /api/notifications/unread-count error:', error)
    return NextResponse.json({ count: 0 })
  }
}