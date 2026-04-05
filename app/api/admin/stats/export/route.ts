import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, department')
      .eq('is_active', true)

    const userIds = (users ?? []).map((u) => u.id)

    const [
      { data: readCounts },
      { data: completions },
      { data: pageStats },
    ] = await Promise.all([
      supabase.from('read_history').select('user_id').in('user_id', userIds),
      supabase.from('book_completions').select('user_id').in('user_id', userIds),
      supabase
        .from('daily_read_stats')
        .select('user_id, pages_read, minutes_read')
        .in('user_id', userIds),
    ])

    const statsMap: Record<string, {
      books: number; completed: number; pages: number; minutes: number
    }> = {}

    readCounts?.forEach((r) => {
      if (!statsMap[r.user_id]) {
        statsMap[r.user_id] = { books: 0, completed: 0, pages: 0, minutes: 0 }
      }
      statsMap[r.user_id].books++
    })
    completions?.forEach((r) => {
      if (!statsMap[r.user_id]) {
        statsMap[r.user_id] = { books: 0, completed: 0, pages: 0, minutes: 0 }
      }
      statsMap[r.user_id].completed++
    })
    pageStats?.forEach((r) => {
      if (!statsMap[r.user_id]) {
        statsMap[r.user_id] = { books: 0, completed: 0, pages: 0, minutes: 0 }
      }
      statsMap[r.user_id].pages += r.pages_read
      statsMap[r.user_id].minutes += r.minutes_read
    })

    const headers = [
      'Nama', 'Email', 'Departemen',
      'Buku Dibaca', 'Buku Selesai',
      'Total Halaman', 'Total Menit Baca',
    ]

    const rows = (users ?? []).map((u) => {
      const s = statsMap[u.id] ?? {
        books: 0, completed: 0, pages: 0, minutes: 0,
      }
      return [
        u.name, u.email, u.department ?? '',
        s.books, s.completed, s.pages, s.minutes,
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="stats-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/stats/export error:', error)
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 })
  }
}