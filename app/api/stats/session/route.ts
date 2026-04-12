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

    if (!bookId || startPage === undefined || endPage === undefined || durationSeconds === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    // Validasi tipe data
    const sp = Number(startPage)
    const ep = Number(endPage)
    const dur = Number(durationSeconds)

    if (isNaN(sp) || isNaN(ep) || isNaN(dur)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Hitung halaman terbaca:
    // - Minimal 1 halaman jika user membuka halaman manapun
    // - endPage - startPage + 1 jika berpindah halaman
    // - Gunakan abs() karena kadang startPage > endPage (navigasi mundur)
    const pagesRead = Math.max(1, Math.abs(ep - sp) + 1)
    const minutesRead = Math.max(0, Math.round(dur / 60))

    // 1. Insert reading session
    const { error: sessionError } = await supabase.from('reading_sessions').insert({
      user_id: session.user.id,
      book_id: bookId,
      start_page: sp,
      end_page: ep,
      duration_seconds: dur,
      session_date: today,
    })

    if (sessionError) {
      console.error('Insert reading_sessions error:', sessionError)
      // Lanjutkan meski error insert session
    }

    // 2. Upsert daily stats — increment, bukan replace
    const { data: existing } = await supabase
      .from('daily_read_stats')
      .select('id, pages_read, minutes_read')
      .eq('user_id', session.user.id)
      .eq('read_date', today)
      .maybeSingle()

    const newPages   = (existing?.pages_read   ?? 0) + pagesRead
    const newMinutes = (existing?.minutes_read  ?? 0) + minutesRead

    const { error: statsError } = await supabase.from('daily_read_stats').upsert(
      {
        user_id:     session.user.id,
        read_date:   today,
        pages_read:  newPages,
        minutes_read: newMinutes,
      },
      { onConflict: 'user_id,read_date' }
    )

    if (statsError) {
      console.error('Upsert daily_read_stats error:', statsError)
    }

    // 3. Update read_history last_page
    await supabase.from('read_history').upsert(
      {
        user_id:      session.user.id,
        book_id:      bookId,
        last_page:    ep,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,book_id' }
    )

    // 4. Cek apakah buku selesai dibaca
    const { data: book } = await supabase
      .from('books')
      .select('total_pages')
      .eq('id', bookId)
      .single()

    let isCompleted = false
    if (book?.total_pages && ep >= book.total_pages) {
      const { error: completionError } = await supabase
        .from('book_completions')
        .upsert(
          { user_id: session.user.id, book_id: bookId },
          { onConflict: 'user_id,book_id', ignoreDuplicates: true }
        )

      if (!completionError) isCompleted = true
    }

    return NextResponse.json({
      success: true,
      isCompleted,
      debug: {
        pagesRead,
        minutesRead,
        totalPagesDay: newPages,
        totalMinutesDay: newMinutes,
      }
    })
  } catch (error) {
    console.error('POST /api/stats/session error:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan sesi baca' },
      { status: 500 }
    )
  }
}