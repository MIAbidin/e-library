import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lastPage } = await request.json()

    if (!lastPage || typeof lastPage !== 'number') {
      return NextResponse.json(
        { error: 'lastPage tidak valid' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Upsert (insert/update)
    const { error } = await supabase
      .from('read_history')
      .upsert(
        {
          user_id: session.user.id,
          book_id: id,
          last_page: lastPage,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST read-history error:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan riwayat baca' },
      { status: 500 }
    )
  }
}
