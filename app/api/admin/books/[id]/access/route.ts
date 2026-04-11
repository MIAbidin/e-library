import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/books/[id]/access
// Ambil daftar akses untuk buku tertentu
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Info buku (termasuk access_type)
    const { data: book } = await supabase
      .from('books')
      .select('id, title, access_type')
      .eq('id', id)
      .single()

    if (!book) return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 })

    // Daftar akses: departemen & user spesifik
    const { data: accesses } = await supabase
      .from('book_access')
      .select(`
        id,
        department,
        user_id,
        user:users(id, name, email, department)
      `)
      .eq('book_id', id)
      .order('created_at')

    return NextResponse.json({
      book,
      accesses: accesses ?? [],
    })
  } catch (err) {
    console.error('GET book access error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data akses' }, { status: 500 })
  }
}

// POST /api/admin/books/[id]/access
// Tambah aturan akses baru
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { department, userId } = body

    if (!department && !userId) {
      return NextResponse.json({ error: 'Pilih departemen atau pengguna' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('book_access')
      .insert({
        book_id: id,
        department: department || null,
        user_id: userId || null,
      })
      .select(`
        id, department, user_id,
        user:users(id, name, email, department)
      `)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Akses sudah ada' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST book access error:', err)
    return NextResponse.json({ error: 'Gagal menambah akses' }, { status: 500 })
  }
}

// PUT /api/admin/books/[id]/access
// Update access_type buku (public / restricted)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { accessType } = await request.json()
    if (!['public', 'restricted'].includes(accessType)) {
      return NextResponse.json({ error: 'access_type tidak valid' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('books')
      .update({ access_type: accessType })
      .eq('id', id)
      .select('id, title, access_type')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('PUT book access_type error:', err)
    return NextResponse.json({ error: 'Gagal update tipe akses' }, { status: 500 })
  }
}