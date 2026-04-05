import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Ambil buku + kategori
    const { data: book, error } = await supabase
      .from('books')
      .select(`
        *,
        category:categories(id, name)
      `)
      .eq('id', id)
      .single()

    if (error || !book) {
      return NextResponse.json(
        { error: 'Buku tidak ditemukan' },
        { status: 404 }
      )
    }

    // Ambil read history
    const { data: history } = await supabase
      .from('read_history')
      .select('last_page, last_read_at')
      .eq('user_id', session.user.id)
      .eq('book_id', id)
      .maybeSingle()

    return NextResponse.json({
      ...book,
      lastPage: history?.last_page ?? 1,
      lastReadAt: history?.last_read_at ?? null,
    })
  } catch (error) {
    console.error('GET /api/books/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data buku' },
      { status: 500 }
    )
  }
}
