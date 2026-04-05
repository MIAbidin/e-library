import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('name, email, role, department, is_active, last_login_at, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Build CSV
    const headers = ['Nama', 'Email', 'Role', 'Departemen', 'Status', 'Login Terakhir', 'Dibuat']
    const rows = (users ?? []).map((u) => [
      u.name,
      u.email,
      u.role,
      u.department ?? '',
      u.is_active ? 'Aktif' : 'Nonaktif',
      formatDate(u.last_login_at),
      formatDate(u.created_at),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users/export error:', error)
    return NextResponse.json({ error: 'Gagal export data' }, { status: 500 })
  }
}