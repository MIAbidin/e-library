import { NextRequest, NextResponse } from 'next/server'
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
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        book_count:books(count)
      `)
      .order('name')

    if (error) throw error

    // Flatten count
    const result = data?.map((cat) => ({
      ...cat,
      book_count: (cat.book_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))

    return NextResponse.json(result ?? [])
  } catch (error) {
    console.error('GET /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/categories error:', error)
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}