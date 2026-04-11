import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchAndFilter } from '@/components/books/SearchAndFilter'
import { Pagination } from '@/components/books/Pagination'
import { formatDate } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    sort?: string
    page?: string
    view?: 'home' | 'catalog'
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = params.view ?? 'home'

  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()
  const userId = session!.user.id

  // ── Fetch categories (dipakai di catalog view) ──────────────────────────
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // ── HOME VIEW: data personal ────────────────────────────────────────────
  if (view === 'home') {
    // Buku sedang dibaca (lanjutan)
    const { data: inProgressRaw } = await supabase
      .from('read_history')
      .select(`
        last_page, last_read_at,
        book:books(id, title, author, cover_url, total_pages,
          category:categories(name))
      `)
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(4)

    // Buku yang sudah selesai (untuk filter dari in-progress)
    const { data: completedRaw } = await supabase
      .from('book_completions')
      .select('book_id')
      .eq('user_id', userId)

    const completedIds = new Set(completedRaw?.map((c) => c.book_id) ?? [])

    const inProgress = (inProgressRaw ?? [])
      .filter((h) => {
        const book = Array.isArray(h.book) ? h.book[0] : h.book
        return book && !completedIds.has((book as any).id)
      })
      .map((h) => {
        const book = (Array.isArray(h.book) ? h.book[0] : h.book) as any
        const progress = book?.total_pages > 0
          ? Math.round((h.last_page / book.total_pages) * 100)
          : 0
        return { ...h, book, progress }
      })

    // Statistik ringkas
    const [
      { count: totalBooksRead },
      { count: totalCompleted },
      { data: streakData },
    ] = await Promise.all([
      supabase.from('read_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('book_completions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('daily_read_stats')
        .select('read_date')
        .eq('user_id', userId)
        .order('read_date', { ascending: false })
        .limit(7),
    ])

    // Hitung streak
    let streak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      for (let i = 0; i < streakData.length; i++) {
        const d = new Date(streakData[i].read_date); d.setHours(0, 0, 0, 0)
        const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
        if (diff === i) streak++
        else break
      }
    }

    // Buku baru (belum pernah dibuka user ini)
    const readBookIds = (inProgressRaw ?? []).map((h) => {
      const book = Array.isArray(h.book) ? h.book[0] : h.book
      return (book as any)?.id
    }).filter(Boolean)

    const completedBookIds = completedRaw?.map((c) => c.book_id) ?? []
    const allReadIds = [...new Set([...readBookIds, ...completedBookIds])]

    let newBooksQuery = supabase
      .from('books')
      .select('id, title, author, cover_url, created_at, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(6)

    // Filter buku yang belum pernah dibuka
    if (allReadIds.length > 0) {
      newBooksQuery = newBooksQuery.not('id', 'in', `(${allReadIds.join(',')})`)
    }

    const { data: newBooks } = await newBooksQuery

    // Notifikasi belum dibaca (untuk greeting badge)
    const { count: unreadNotifs } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return (
      <div className="space-y-8">
        {/* ── GREETING ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {session?.user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(unreadNotifs ?? 0) > 0 && (
              <Link href="/dashboard/notifications"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600
                  bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                🔔 <span className="font-semibold">{unreadNotifs}</span> notifikasi baru
              </Link>
            )}
            <Link href="/dashboard?view=catalog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600
                bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm">
              📚 Jelajahi Semua Buku
            </Link>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '📖', label: 'Buku Dibuka', value: totalBooksRead ?? 0, color: 'blue' },
            { icon: '✅', label: 'Buku Selesai', value: totalCompleted ?? 0, color: 'green' },
            { icon: '🔥', label: 'Streak Hari', value: `${streak} hari`, color: 'orange' },
            { icon: '📚', label: 'Sedang Dibaca', value: inProgress.length, color: 'purple' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── LANJUTKAN MEMBACA ─────────────────────────────────────────── */}
        {inProgress.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📖 Lanjutkan Membaca</h2>
              <Link href="/dashboard/stats" className="text-sm text-blue-600 hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inProgress.map((item) => (
                <Link
                  key={item.book.id}
                  href={`/dashboard/books/${item.book.id}/read?page=${item.last_page}`}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl
                    p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  {/* Cover */}
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-gradient-to-br
                    from-blue-100 to-indigo-100 flex-shrink-0">
                    {item.book.cover_url ? (
                      <Image src={item.book.cover_url} alt={item.book.title}
                        width={56} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📗</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {item.book.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.book.author}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Hal. {item.last_page}/{item.book.total_pages}</span>
                        <span className="font-semibold text-blue-600">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <span className="text-gray-300 text-xl flex-shrink-0 group-hover:text-blue-400 transition">›</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── EMPTY STATE: belum baca apapun ───────────────────────────── */}
        {inProgress.length === 0 && (totalBooksRead ?? 0) === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100
            rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mulai petualangan membaca!</h3>
            <p className="text-gray-500 text-sm mb-5">
              Jelajahi koleksi e-book perusahaan dan mulai membaca sekarang.
            </p>
            <Link href="/dashboard?view=catalog"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                text-white font-medium px-6 py-3 rounded-xl transition text-sm">
              Jelajahi Koleksi →
            </Link>
          </div>
        )}

        {/* ── BUKU BARU UNTUKMU ─────────────────────────────────────────── */}
        {(newBooks ?? []).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">✨ Buku Baru Untukmu</h2>
                <p className="text-xs text-gray-400 mt-0.5">Koleksi yang belum pernah kamu buka</p>
              </div>
              <Link href="/dashboard?view=catalog" className="text-sm text-blue-600 hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(newBooks ?? []).map((book) => (
                <Link key={book.id} href={`/dashboard/books/${book.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden
                    hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer">
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4]">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 16vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">📗</div>
                      )}
                      {/* "Baru" badge jika < 7 hari */}
                      {book.created_at && new Date(book.created_at) > new Date(Date.now() - 7 * 86400000) && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Baru
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{book.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── QUICK LINKS ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔗 Akses Cepat</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/stats', icon: '📊', label: 'Statistik Saya', desc: 'Progress & streak' },
              { href: '/dashboard?view=catalog', icon: '📚', label: 'Semua Buku', desc: 'Katalog lengkap' },
              { href: '/dashboard/notifications', icon: '🔔', label: 'Notifikasi', desc: 'Pesan & update' },
              { href: '/dashboard/settings/notifications', icon: '⚙️', label: 'Pengaturan', desc: 'Preferensi notif' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4
                  hover:shadow-sm hover:border-blue-200 transition group">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                  group-hover:bg-blue-50 transition">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // ── CATALOG VIEW: semua buku dengan search/filter ──────────────────────
  const search = params.search ?? ''
  const categoryId = params.category ?? ''
  const sort = params.sort ?? 'newest'
  const page = parseInt(params.page ?? '1')
  const limit = 12

  let query = supabase
    .from('books')
    .select('*, category:categories(id, name)', { count: 'exact' })

  if (search.trim()) query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'title_asc') query = query.order('title', { ascending: true })
  else if (sort === 'title_desc') query = query.order('title', { ascending: false })

  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data: books, count } = await query
  const totalPages = Math.ceil((count ?? 0) / limit)

  const { data: historyRows } = await supabase
    .from('read_history')
    .select('book_id, last_page')
    .eq('user_id', userId)

  const readHistory: Record<string, number> = {}
  historyRows?.forEach((h) => { readHistory[h.book_id] = h.last_page })

  return (
    <div>
      {/* Header catalog */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
              ← Beranda
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Buku</h1>
          <p className="text-gray-500 text-sm mt-1">Temukan dan baca koleksi e-book perusahaan</p>
        </div>
      </div>

      <Suspense>
        <SearchAndFilter
          categories={categories ?? []}
          basePath="/dashboard"
          extraParams={{ view: 'catalog' }}
        />
      </Suspense>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {count !== null ? (
            <>
              Menampilkan <span className="font-medium text-gray-700">{books?.length ?? 0}</span>{' '}
              dari <span className="font-medium text-gray-700">{count}</span> buku
              {search && <> untuk "<span className="font-medium">{search}</span>"</>}
            </>
          ) : 'Memuat...'}
        </p>
      </div>

      {/* Grid buku */}
      {(books ?? []).length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">📭</span>
          <p className="text-gray-500 mt-4 text-sm">Tidak ada buku yang cocok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {(books ?? []).map((book) => {
            const lastPage = readHistory[book.id]
            const progress = book.total_pages > 0 && lastPage
              ? Math.round((lastPage / book.total_pages) * 100) : null

            return (
              <Link key={book.id} href={`/dashboard/books/${book.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden
                  hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer h-full flex flex-col">
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4] overflow-hidden">
                    {book.cover_url ? (
                      <Image src={book.cover_url} alt={book.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-5xl mb-2">📗</span>
                        <p className="text-xs text-indigo-400 font-medium line-clamp-2">{book.title}</p>
                      </div>
                    )}
                    {progress !== null && progress > 0 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {progress === 100 ? '✅' : `${progress}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{book.title}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">{book.author}</p>
                    <div className="mt-auto flex items-center justify-between">
                      {book.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {(book.category as any).name}
                        </span>
                      )}
                      {book.year && <span className="text-xs text-gray-400">{book.year}</span>}
                    </div>
                    {progress !== null && progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Suspense>
        <Pagination currentPage={page} totalPages={totalPages} />
      </Suspense>
    </div>
  )
}