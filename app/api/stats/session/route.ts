import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookId, startPage, endPage, durationSeconds } = body

    if (!bookId || !startPage || !endPage || durationSeconds === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const pagesRead = Math.max(0, endPage - startPage)
    const minutesRead = Math.round(durationSeconds / 60)

    // 1. Insert reading session
    await supabase.from('reading_sessions').insert({
      user_id: session.user.id,
      book_id: bookId,
      start_page: startPage,
      end_page: endPage,
      duration_seconds: durationSeconds,
      session_date: today,
    })

    // 2. Upsert daily stats — increment, bukan replace
    const { data: existing } = await supabase
      .from('daily_read_stats')
      .select('pages_read, minutes_read')
      .eq('user_id', session.user.id)
      .eq('read_date', today)
      .maybeSingle()

    await supabase.from('daily_read_stats').upsert(
      {
        user_id: session.user.id,
        read_date: today,
        pages_read: (existing?.pages_read ?? 0) + pagesRead,
        minutes_read: (existing?.minutes_read ?? 0) + minutesRead,
      },
      { onConflict: 'user_id,read_date' }
    )

    // 3. Cek apakah buku selesai dibaca
    const { data: book } = await supabase
      .from('books')
      .select('total_pages')
      .eq('id', bookId)
      .single()

    let isCompleted = false
    if (book?.total_pages && endPage >= book.total_pages) {
      const { error: completionError } = await supabase
        .from('book_completions')
        .upsert(
          { user_id: session.user.id, book_id: bookId },
          { onConflict: 'user_id,book_id', ignoreDuplicates: true }
        )

      if (!completionError) isCompleted = true
    }

    return NextResponse.json({ success: true, isCompleted })
  } catch (error) {
    console.error('POST /api/stats/session error:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan sesi baca' },
      { status: 500 }
    )
  }
}