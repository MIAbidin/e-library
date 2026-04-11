import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = createAdminClient()

    const { data: book, error } = await supabase
      .from('books')
      .select('id, title, author, description, year, total_pages, cover_url, category_id, created_at, category:categories(id, name)')
      .eq('id', id)
      .single()

    if (error || !book) {
      return NextResponse.json({ error: 'Buku tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('GET /api/public/books/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data buku' }, { status: 500 })
  }
}