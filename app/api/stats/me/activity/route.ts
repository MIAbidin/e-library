import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30')

    const supabase = createAdminClient()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromDateStr = fromDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_read_stats')
      .select('read_date, pages_read, minutes_read')
      .eq('user_id', session.user.id)
      .gte('read_date', fromDateStr)
      .order('read_date', { ascending: true })

    if (error) throw error

    // Fill tanggal yang kosong dengan 0
    const result: { date: string; pages: number; minutes: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const found = data?.find((row) => row.read_date === dateStr)
      result.push({
        date: dateStr,
        pages: found?.pages_read ?? 0,
        minutes: found?.minutes_read ?? 0,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/stats/me/activity error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data aktivitas' },
      { status: 500 }
    )
  }
}