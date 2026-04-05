import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

type BookWithCategory = {
  id: string
  title: string
  author: string
  cover_url: string | null
  total_pages?: number
  category: { name: string }[]
} | null

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const userId = session.user.id

    // Buku sedang dibaca (ada di read_history, belum selesai)
    const { data: inProgress } = await supabase
      .from('read_history')
      .select(`
        last_page,
        last_read_at,
        book:books(id, title, author, cover_url, total_pages,
          category:categories(name))
      `)
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(10)

    // Buku selesai
    const { data: completed } = await supabase
      .from('book_completions')
      .select(`
        completed_at,
        book:books(id, title, author, cover_url,
          category:categories(name))
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Set completed book IDs untuk filter
    const completedBookIds = new Set(
      completed?.map((c) => {
        const book = (Array.isArray(c.book) ? c.book[0] : c.book) as BookWithCategory
        return book?.id
      }).filter(Boolean) ?? []
    )

    // Tambah progress ke in-progress books
    const inProgressWithProgress = inProgress
      ?.filter((h) => {
        const book = (Array.isArray(h.book) ? h.book[0] : h.book) as BookWithCategory
        return book && !completedBookIds.has(book.id)
      })
      .map((h) => {
        const book = (Array.isArray(h.book) ? h.book[0] : h.book) as BookWithCategory
        const progress =
          book?.total_pages && book.total_pages > 0
            ? Math.round((h.last_page / book.total_pages) * 100)
            : 0
        return { ...h, progress }
      })

    return NextResponse.json({
      inProgress: inProgressWithProgress ?? [],
      completed: completed ?? [],
    })
  } catch (error) {
    console.error('GET /api/stats/me/books error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data buku' },
      { status: 500 }
    )
  }
}