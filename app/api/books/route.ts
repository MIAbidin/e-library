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
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('category') ?? ''
    const sort = searchParams.get('sort') ?? 'newest'
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '12')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    let query = supabase
      .from('books')
      .select(`
        *,
        category:categories(id, name)
      `, { count: 'exact' })

    // Filter search
    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%`
      )
    }

    // Filter kategori
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    // Sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'title_asc') {
      query = query.order('title', { ascending: true })
    } else if (sort === 'title_desc') {
      query = query.order('title', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      books: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/books error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data buku' },
      { status: 500 }
    )
  }
}