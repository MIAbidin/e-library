import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

type UserStats = {
  booksRead: number
  booksCompleted: number
  pagesRead: number
  minutesRead: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    let userQuery = supabase
      .from('users')
      .select('id, name, email, department, last_login_at', { count: 'exact' })
      .eq('is_active', true)

    if (department) {
      userQuery = userQuery.eq('department', department)
    }

    userQuery = userQuery
      .order('last_login_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    const { data: users, count, error } = await userQuery
    if (error) throw error

    const userIds = (users ?? []).map((u) => u.id)

    const [
      { data: readHistoryCounts },
      { data: completionCounts },
      { data: pagesCounts },
    ] = await Promise.all([
      supabase
        .from('read_history')
        .select('user_id')
        .in('user_id', userIds),

      supabase
        .from('book_completions')
        .select('user_id')
        .in('user_id', userIds),

      supabase
        .from('daily_read_stats')
        .select('user_id, pages_read, minutes_read')
        .in('user_id', userIds),
    ])

    const statsMap: Record<string, UserStats> = {}

    // helper biar gak nulis berulang
    const initUser = (userId: string) => {
      if (!statsMap[userId]) {
        statsMap[userId] = {
          booksRead: 0,
          booksCompleted: 0,
          pagesRead: 0,
          minutesRead: 0,
        }
      }
    }

    readHistoryCounts?.forEach((r) => {
      if (!r.user_id) return
      initUser(r.user_id)
      statsMap[r.user_id].booksRead++
    })

    completionCounts?.forEach((r) => {
      if (!r.user_id) return
      initUser(r.user_id)
      statsMap[r.user_id].booksCompleted++
    })

    pagesCounts?.forEach((r) => {
      if (!r.user_id) return
      initUser(r.user_id)
      statsMap[r.user_id].pagesRead += r.pages_read ?? 0
      statsMap[r.user_id].minutesRead += r.minutes_read ?? 0
    })

    const result = (users ?? []).map((u) => ({
      ...u,
      stats: statsMap[u.id] ?? {
        booksRead: 0,
        booksCompleted: 0,
        pagesRead: 0,
        minutesRead: 0,
      },
    }))

    return NextResponse.json({
      users: result,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      page,
    })
  } catch (error) {
    console.error('GET /api/admin/stats/users error:', error)

    return NextResponse.json(
      { error: 'Gagal mengambil statistik user' },
      { status: 500 }
    )
  }
}
