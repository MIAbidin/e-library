'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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

export default function PublicBooksClient() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  // Sync dari URL (AMAN sekarang karena client component)
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setCategory(searchParams.get('category') ?? '')
    setSort(searchParams.get('sort') ?? 'newest')
    setPage(parseInt(searchParams.get('page') ?? '1'))
  }, [searchParams])

  // Fetch categories
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

  // debounce search
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
      {/* NAVBAR */}
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold">📚 E-Library</Link>

          {session ? (
            <Link href="/dashboard" className="text-sm bg-blue-600 text-white px-3 py-2 rounded">
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">Masuk</Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-3 py-2 rounded">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* FILTER */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari..."
            className="border px-3 py-2 rounded"
          />

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="border px-3 py-2 rounded"
          >
            <option value="">Semua</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="border px-3 py-2 rounded"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>

          {hasFilter && (
            <button onClick={handleReset} className="border px-3 py-2 rounded">
              Reset
            </button>
          )}
        </div>

        {/* LIST */}
        {loading ? (
          <p>Loading...</p>
        ) : books.length === 0 ? (
          <p>Tidak ada buku</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {books.map(book => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <div className="border rounded p-2">
                  {book.cover_url && (
                    <Image src={book.cover_url} alt={book.title} width={120} height={160} />
                  )}
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Prev
          </button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
