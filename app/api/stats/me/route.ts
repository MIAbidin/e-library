import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const userId = session.user.id

    // Parallel fetch semua data sekaligus
    const [
      { count: totalBooksRead },
      { count: totalBooksCompleted },
      { data: pagesData },
      { data: streakData },
    ] = await Promise.all([
      supabase
        .from('read_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('book_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),

      supabase
        .from('daily_read_stats')
        .select('pages_read, minutes_read')
        .eq('user_id', userId),

      supabase
        .from('daily_read_stats')
        .select('read_date')
        .eq('user_id', userId)
        .order('read_date', { ascending: false })
        .limit(30),
    ])

    const totalPagesRead = pagesData?.reduce((sum, d) => sum + d.pages_read, 0) ?? 0
    const totalMinutesRead = pagesData?.reduce((sum, d) => sum + d.minutes_read, 0) ?? 0

    // Hitung streak harian
    let streak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < streakData.length; i++) {
        const date = new Date(streakData[i].read_date)
        date.setHours(0, 0, 0, 0)
        const diffDays = Math.round(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (diffDays === i) {
          streak++
        } else {
          break
        }
      }
    }

    return NextResponse.json({
      totalBooksRead: totalBooksRead ?? 0,
      totalBooksCompleted: totalBooksCompleted ?? 0,
      totalPagesRead,
      totalMinutesRead,
      streak,
    })
  } catch (error) {
    console.error('GET /api/stats/me error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}