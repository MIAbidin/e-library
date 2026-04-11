'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  year: number | null
  total_pages: number
  cover_url: string | null
  category?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

export default function PublicBooksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'))

  // Fetch categories once
  useEffect(() => {
    fetch('/api/public/categories')
      .then(r => r.json())
      .then(data => setCategories(data ?? []))
      .catch(() => {})
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
        ...(search && { search }),
        ...(category && { category }),
      })
      const res = await fetch(`/api/public/books?${params}`)
      const data = await res.json()
      setBooks(data.books ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [page, search, category, sort])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    setPage(1)
  }

  const hasFilter = search || category || sort !== 'newest'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== NAVBAR ===== */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">
              📚
            </div>
            <span className="hidden sm:block">E-Library Perusahaan</span>
            <span className="sm:hidden">E-Library</span>
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href={session.user.role === 'admin' ? '/admin' : '/dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                  px-4 py-2 rounded-lg transition"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                    px-4 py-2 rounded-lg transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO SMALL ===== */}
      <div className="bg-white border-b border-gray-100 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Katalog E-Book
          </h1>
          <p className="text-gray-500 text-sm">
            {total > 0 ? `${total} buku tersedia` : 'Jelajahi koleksi buku digital perusahaan'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* ===== FILTER BAR ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau penulis..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700
                min-w-[150px]"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700
                min-w-[130px]"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="title_asc">Judul A-Z</option>
              <option value="title_desc">Judul Z-A</option>
            </select>

            {hasFilter && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border
                  border-gray-200 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ===== BOOK GRID ===== */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">📭</span>
            <p className="text-gray-500 mt-4 text-sm">
              {hasFilter ? 'Tidak ada buku yang cocok dengan pencarian' : 'Belum ada buku tersedia'}
            </p>
            {hasFilter && (
              <button
                onClick={handleReset}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
            {books.map((book) => (
              <PublicBookCard key={book.id} book={book} isLoggedIn={!!session} />
            ))}
          </div>
        )}

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                hover:bg-gray-50 disabled:opacity-40 transition"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* ===== CTA for non-logged in ===== */}
        {!session && (
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl
            p-6 lg:p-8 text-center text-white">
            <h2 className="text-lg lg:text-xl font-bold mb-2">
              Mulai Membaca Sekarang
            </h2>
            <p className="text-blue-100 text-sm mb-5">
              Login untuk melacak progres bacaan, mendapat notifikasi buku baru, dan akses semua fitur.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className="bg-white text-blue-600 font-semibold text-sm px-5 py-2.5
                  rounded-lg hover:bg-blue-50 transition"
              >
                Daftar Gratis
              </Link>
              <Link
                href="/auth/login"
                className="text-white border border-white/40 text-sm font-medium
                  px-5 py-2.5 rounded-lg hover:bg-white/10 transition"
              >
                Sudah punya akun
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-10 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} E-Library Perusahaan. Confidential.
      </footer>
    </div>
  )
}

function PublicBookCard({ book, isLoggedIn }: { book: Book; isLoggedIn: boolean }) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full flex flex-col">
        {/* Cover */}
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
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2 truncate">{book.author}</p>

          <div className="mt-auto flex items-center justify-between">
            {book.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                font-medium bg-blue-100 text-blue-700">
                {book.category.name}
              </span>
            )}
            {book.year && (
              <span className="text-xs text-gray-400">{book.year}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}