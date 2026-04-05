import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

type Activity = {
  pages: number
  minutes: number
}

type BookCount = {
  count: number
  book: unknown
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const [
      { count: totalUsers },
      { count: totalActiveUsers },
      { count: totalBooks },
      { count: totalSessions },
      { data: topBooks },
      { data: recentActivity },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      supabase
        .from('books')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true }),

      // Top books
      supabase
        .from('read_history')
        .select('book_id, book:books(id, title, author, cover_url)')
        .limit(200),

      // Aktivitas 7 hari terakhir
      supabase
        .from('daily_read_stats')
        .select('read_date, pages_read, minutes_read')
        .gte(
          'read_date',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
        )
        .order('read_date', { ascending: true }),
    ])

    // ===============================
    // 📚 Hitung Top Books
    // ===============================
    const bookReadCount: Record<string, BookCount> = {}

    topBooks?.forEach((row) => {
      if (!row.book_id) return

      if (!bookReadCount[row.book_id]) {
        bookReadCount[row.book_id] = {
          count: 0,
          book: row.book,
        }
      }

      bookReadCount[row.book_id].count++
    })

    const topBooksRanked = Object.values(bookReadCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // ===============================
    // 📊 Agregasi Aktivitas Harian
    // ===============================
    const activityByDate: Record<string, Activity> = {}

    recentActivity?.forEach((row) => {
      if (!row.read_date) return

      if (!activityByDate[row.read_date]) {
        activityByDate[row.read_date] = { pages: 0, minutes: 0 }
      }

      activityByDate[row.read_date].pages += row.pages_read ?? 0
      activityByDate[row.read_date].minutes += row.minutes_read ?? 0
    })

    // ===============================
    // 📅 Generate 7 Hari Terakhir
    // ===============================
    const weeklyActivity = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)

      const dateStr = d.toISOString().split('T')[0]

      weeklyActivity.push({
        date: dateStr,
        pages: activityByDate[dateStr]?.pages ?? 0,
        minutes: activityByDate[dateStr]?.minutes ?? 0,
      })
    }

    // ===============================
    // 🚀 Response
    // ===============================
    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalActiveUsers: totalActiveUsers ?? 0,
      totalBooks: totalBooks ?? 0,
      totalSessions: totalSessions ?? 0,
      topBooks: topBooksRanked,
      weeklyActivity,
    })
  } catch (error) {
    console.error('GET /api/admin/stats/overview error:', error)

    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}
