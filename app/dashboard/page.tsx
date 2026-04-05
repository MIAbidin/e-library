import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { SearchAndFilter } from '@/components/books/SearchAndFilter'
import { BookGrid } from '@/components/books/BookGrid'
import { Pagination } from '@/components/books/Pagination'
import { Suspense } from 'react'

interface PageProps {
  searchParams: {
    search?: string
    category?: string
    sort?: string
    page?: string
  }
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams

  const search = params.search ?? ''
  const categoryId = params.category ?? ''
  const sort = params.sort ?? 'newest'
  const page = parseInt(params.page ?? '1')

  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()
  const limit = 12

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Build books query
  let query = supabase
    .from('books')
    .select('*, category:categories(id, name)', { count: 'exact' })

  if (search.trim()) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'title_asc') query = query.order('title', { ascending: true })
  else if (sort === 'title_desc') query = query.order('title', { ascending: false })

  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data: books, count } = await query
  const totalPages = Math.ceil((count ?? 0) / limit)

  // Fetch read history user ini untuk progress
  const { data: historyRows } = await supabase
    .from('read_history')
    .select('book_id, last_page')
    .eq('user_id', session!.user.id)

  const readHistory: Record<string, number> = {}
  historyRows?.forEach((h) => {
    readHistory[h.book_id] = h.last_page
  })

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Temukan dan baca koleksi e-book perusahaan
        </p>
      </div>

      {/* Search & Filter */}
      <Suspense>
        <SearchAndFilter categories={categories ?? []} />
      </Suspense>

      {/* Result info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {count !== null ? (
            <>
              Menampilkan <span className="font-medium text-gray-700">{books?.length ?? 0}</span>{' '}
              dari <span className="font-medium text-gray-700">{count}</span> buku
              {search && <> untuk "<span className="font-medium">{search}</span>"</>}
            </>
          ) : (
            'Memuat...'
          )}
        </p>
      </div>

      {/* Grid */}
      <BookGrid
        books={books ?? []}
        readHistory={readHistory}
      />

      {/* Pagination */}
      <Suspense>
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}