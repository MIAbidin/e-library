import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SearchAndFilter } from '@/components/books/SearchAndFilter'
import { Pagination } from '@/components/books/Pagination'

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

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // ── CATALOG VIEW ────────────────────────────────────────────────────────
  if (view === 'catalog') {
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
                {search && <> untuk &ldquo;<span className="font-medium">{search}</span>&rdquo;</>}
              </>
            ) : 'Memuat...'}
          </p>
        </div>

        {(books ?? []).length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">📭</span>
            <p className="text-gray-500 mt-4 text-sm">Tidak ada buku yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {(books ?? []).map((book) => {
              const lastPage = readHistory[book.id]
              const progress =
                book.total_pages > 0 && lastPage
                  ? Math.round((lastPage / book.total_pages) * 100)
                  : null

              return (
                <Link key={book.id} href={`/dashboard/books/${book.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer h-full flex flex-col">
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4] overflow-hidden">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
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
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 truncate">{book.author}</p>
                      <div className="mt-auto flex items-center justify-between">
                        {book.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {(book.category as { name: string }).name}
                          </span>
                        )}
                        {book.year && <span className="text-xs text-gray-400">{book.year}</span>}
                      </div>
                      {progress !== null && progress > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
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

  // ── HOME VIEW ────────────────────────────────────────────────────────────

  const [
    { data: inProgressRaw },
    { data: completedRaw },
    { count: totalBooksRead },
    { count: totalCompleted },
    { data: streakData },
    { data: pageStatsData },
    { count: unreadNotifs },
  ] = await Promise.all([
    supabase
      .from('read_history')
      .select(`last_page, last_read_at, book:books(id, title, author, cover_url, total_pages, category:categories(name))`)
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false })
      .limit(4),
    supabase
      .from('book_completions')
      .select(`book_id, completed_at, book:books(id, title, author, cover_url, category:categories(name))`)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(3),
    supabase.from('read_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('book_completions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('daily_read_stats')
      .select('read_date')
      .eq('user_id', userId)
      .order('read_date', { ascending: false })
      .limit(7),
    supabase
      .from('daily_read_stats')
      .select('pages_read, minutes_read')
      .eq('user_id', userId),
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  ])

  // Hitung streak
  let streak = 0
  if (streakData && streakData.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < streakData.length; i++) {
      const d = new Date(streakData[i].read_date)
      d.setHours(0, 0, 0, 0)
      const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
      if (diff === i) streak++
      else break
    }
  }

  // Total halaman & menit
  const totalPages = pageStatsData?.reduce((s, d) => s + d.pages_read, 0) ?? 0
  const totalMinutes = pageStatsData?.reduce((s, d) => s + d.minutes_read, 0) ?? 0

  // Buku selesai IDs
  const completedIds = new Set(completedRaw?.map((c) => c.book_id) ?? [])

  // In-progress (exclude yang sudah selesai)
  const inProgress = (inProgressRaw ?? [])
    .filter((h) => {
      const book = Array.isArray(h.book) ? h.book[0] : h.book
      return book && !completedIds.has((book as { id: string }).id)
    })
    .map((h) => {
      const book = (Array.isArray(h.book) ? h.book[0] : h.book) as {
        id: string; title: string; author: string; cover_url: string | null; total_pages: number
      }
      const progress =
        book?.total_pages > 0 ? Math.round((h.last_page / book.total_pages) * 100) : 0
      return { ...h, book, progress }
    })

  // Buku baru (belum pernah dibuka)
  const readBookIds = (inProgressRaw ?? [])
    .map((h) => {
      const book = Array.isArray(h.book) ? h.book[0] : h.book
      return (book as { id: string } | null)?.id
    })
    .filter(Boolean)
  const completedBookIds = completedRaw?.map((c) => c.book_id) ?? []
  const allReadIds = [...new Set([...readBookIds, ...completedBookIds])]

  let newBooksQuery = supabase
    .from('books')
    .select('id, title, author, cover_url, created_at, category:categories(name)')
    .order('created_at', { ascending: false })
    .limit(6)
  if (allReadIds.length > 0) {
    newBooksQuery = newBooksQuery.not('id', 'in', `(${allReadIds.join(',')})`)
  }
  const { data: newBooks } = await newBooksQuery

  const hasNoActivity = (totalBooksRead ?? 0) === 0

  // Format menit ke jam & menit
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mnt`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}j ${m}mnt` : `${h} jam`
  }

  return (
    <div className="space-y-7 max-w-5xl">
      {/* ── GREETING ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Halo, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(unreadNotifs ?? 0) > 0 && (
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
            >
              🔔 <span className="font-semibold">{unreadNotifs}</span> notifikasi baru
            </Link>
          )}
          <Link
            href="/dashboard?view=catalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            📚 Jelajahi Semua Buku
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '📖', label: 'Buku Dibuka', value: totalBooksRead ?? 0, color: 'blue', href: '/dashboard/stats' },
          { icon: '✅', label: 'Buku Selesai', value: totalCompleted ?? 0, color: 'green', href: '/dashboard/stats?tab=completed' },
          { icon: '📄', label: 'Total Halaman', value: totalPages, color: 'purple', href: '/dashboard/stats' },
          { icon: '⏱️', label: 'Waktu Baca', value: formatDuration(totalMinutes), color: 'orange', href: '/dashboard/stats' },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── EMPTY STATE ──────────────────────────────────────── */}
      {hasNoActivity && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mulai petualangan membacamu!</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Jelajahi ribuan koleksi e-book perusahaan dan mulai membaca sekarang. Progress kamu akan tersimpan otomatis.
          </p>
          <Link
            href="/dashboard?view=catalog"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition text-sm"
          >
            Jelajahi Koleksi →
          </Link>
        </div>
      )}

      {/* ── LANJUTKAN MEMBACA ─────────────────────────────────── */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">📖 Lanjutkan Membaca</h2>
            <Link href="/dashboard/stats" className="text-sm text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inProgress.map((item) => (
              <Link
                key={item.book.id}
                href={`/dashboard/books/${item.book.id}/read?page=${item.last_page}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-14 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                  {item.book.cover_url ? (
                    <Image
                      src={item.book.cover_url}
                      alt={item.book.title}
                      width={56}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                    {item.book.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{item.book.author}</p>
                  <div className="mt-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">
                        Hal. {item.last_page}/{item.book.total_pages}
                      </span>
                      <span className="font-semibold text-blue-600">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-gray-300 text-xl flex-shrink-0 group-hover:text-blue-400 transition">›</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── BARU DISELESAIKAN ────────────────────────────────── */}
      {(completedRaw ?? []).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">🏆 Baru Kamu Selesaikan</h2>
            <Link href="/dashboard/stats?tab=completed" className="text-sm text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(completedRaw ?? []).map((item) => {
              const book = (Array.isArray(item.book) ? item.book[0] : item.book) as {
                id: string; title: string; author: string; cover_url: string | null
              } | null
              if (!book) return null
              return (
                <Link
                  key={book.id}
                  href={`/dashboard/books/${book.id}`}
                  className="flex-shrink-0 w-36 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-green-50 to-emerald-100">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="144px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">✅</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        Selesai
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── STREAK BANNER (jika streak > 0) ──────────────────── */}
      {streak > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0">🔥</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">
              Streak {streak} hari! {streak >= 7 ? '🎉 Luar biasa!' : 'Pertahankan!'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {streak >= 7
                ? 'Kamu sudah membaca konsisten lebih dari seminggu. Teruskan!'
                : 'Baca minimal 1 halaman hari ini untuk mempertahankan streak.'}
            </p>
          </div>
          <Link
            href="/dashboard?view=catalog"
            className="flex-shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700 transition whitespace-nowrap"
          >
            Baca sekarang →
          </Link>
        </div>
      )}

      {/* ── BUKU BARU UNTUKMU ─────────────────────────────────── */}
      {(newBooks ?? []).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">✨ Buku Baru Untukmu</h2>
              <p className="text-xs text-gray-400 mt-0.5">Koleksi yang belum pernah kamu buka</p>
            </div>
            <Link href="/dashboard?view=catalog" className="text-sm text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(newBooks ?? []).map((book) => (
              <Link key={book.id} href={`/dashboard/books/${book.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer">
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4]">
                    {book.cover_url ? (
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 16vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">📗</div>
                    )}
                    {book.created_at &&
                      new Date(book.created_at) > new Date(Date.now() - 7 * 86400000) && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Baru
                          </span>
                        </div>
                      )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── QUICK LINKS ──────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">🔗 Akses Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/stats', icon: '📊', label: 'Statistik Saya', desc: 'Progress & streak' },
            { href: '/dashboard?view=catalog', icon: '📚', label: 'Semua Buku', desc: 'Katalog lengkap' },
            { href: '/dashboard/notifications', icon: '🔔', label: 'Notifikasi', desc: 'Pesan & update' },
            {
              href: '/dashboard/settings/notifications',
              icon: '⚙️',
              label: 'Pengaturan',
              desc: 'Preferensi notif',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-blue-200 transition group"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-blue-50 transition">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}