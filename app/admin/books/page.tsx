'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Book, Category } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { BookForm } from '@/components/books/BookForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'
import { formatDate, truncate } from '@/lib/utils'
import { BookAccessManager } from '@/components/books/BookAccessManager'

// Extend Book type locally
interface BookWithAccess extends Book {
  access_type?: 'public' | 'restricted'
}

export default function AdminBooksPage() {
  const [books, setBooks]           = useState<BookWithAccess[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  const [showForm, setShowForm]     = useState(false)
  const [editBook, setEditBook]     = useState<BookWithAccess | null>(null)
  const [deleteBook, setDeleteBook] = useState<BookWithAccess | null>(null)
  const [deleting, setDeleting]     = useState(false)

  // Access manager modal
  const [accessBook, setAccessBook] = useState<BookWithAccess | null>(null)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/books?${params}`)
      const data = await res.json()
      setBooks(data.books ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Gagal memuat data buku')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data ?? [])
  }, [])

  useEffect(() => { fetchBooks() }, [fetchBooks])
  useEffect(() => { fetchCategories() }, [fetchCategories])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchBooks() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleFormSuccess = (_book: BookWithAccess) => {
    setShowForm(false)
    setEditBook(null)
    fetchBooks()
  }

  const handleDelete = async () => {
    if (!deleteBook) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/books/${deleteBook.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Buku berhasil dihapus')
      setDeleteBook(null)
      fetchBooks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus buku')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kelola Buku"
        description={`${total} buku dalam sistem`}
        action={
          <button
            onClick={() => { setEditBook(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
              text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl transition shadow-sm"
          >
            <span className="hidden sm:inline">+</span>
            <span className="hidden sm:inline">Upload Buku Baru</span>
            <span className="sm:hidden">+ Upload</span>
          </button>
        }
      />

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 mb-4">
        <div className="relative w-full lg:max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau penulis..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 mt-3 text-sm">
              {search ? 'Tidak ada buku yang cocok' : 'Belum ada buku. Upload buku pertama!'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Buku
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Akses
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Halaman
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Ditambahkan
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                            {book.cover_url ? (
                              <Image src={book.cover_url} alt={book.title} width={40} height={56}
                                className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📗</div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {truncate(book.title, 40)}
                            </p>
                            <p className="text-xs text-gray-400">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {book.category ? (
                          <Badge variant="blue">{book.category.name}</Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Access badge */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setAccessBook(book)}
                          className="group flex items-center gap-1.5"
                          title="Kelola akses"
                        >
                          {book.access_type === 'restricted' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold
                              bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full
                              group-hover:bg-amber-200 transition">
                              🔒 Terbatas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold
                              bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full
                              group-hover:bg-green-200 transition">
                              🌐 Publik
                            </span>
                          )}
                          <span className="text-xs text-gray-300 group-hover:text-blue-400 transition">
                            ✏️
                          </span>
                        </button>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {book.total_pages > 0 ? `${book.total_pages} hal` : '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {formatDate(book.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setAccessBook(book)}
                            className="px-2.5 py-1.5 text-xs text-purple-600 border border-purple-200
                              rounded-lg hover:bg-purple-50 transition font-medium"
                            title="Kelola akses buku"
                          >
                            🔑 Akses
                          </button>
                          <button
                            onClick={() => { setEditBook(book); setShowForm(true) }}
                            className="px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200
                              rounded-lg hover:bg-blue-50 transition font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteBook(book)}
                            className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200
                              rounded-lg hover:bg-red-50 transition font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {books.map((book) => (
                <div key={book.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-16 rounded overflow-hidden bg-gradient-to-br
                      from-blue-100 to-indigo-100 flex-shrink-0">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} width={48} height={64}
                          className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                        {book.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{book.author}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {book.category && <Badge variant="blue">{book.category.name}</Badge>}
                        {book.access_type === 'restricted' ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            🔒 Terbatas
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            🌐 Publik
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => setAccessBook(book)}
                      className="py-2 text-xs text-purple-600 border border-purple-200
                        rounded-lg hover:bg-purple-50 transition font-medium"
                    >
                      🔑 Akses
                    </button>
                    <button
                      onClick={() => { setEditBook(book); setShowForm(true) }}
                      className="py-2 text-xs text-blue-600 border border-blue-200
                        rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteBook(book)}
                      className="py-2 text-xs text-red-600 border border-red-200
                        rounded-lg hover:bg-red-50 transition font-medium"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{page}/{totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                  hover:bg-gray-50 disabled:opacity-40 transition">
                ← Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                  hover:bg-gray-50 disabled:opacity-40 transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Upload / Edit */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditBook(null) }}
        title={editBook ? 'Edit Buku' : 'Upload Buku Baru'} size="lg">
        <BookForm
          categories={categories}
          initialData={editBook ?? undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditBook(null) }}
        />
      </Modal>

      {/* Modal: Kontrol Akses */}
      <Modal
        isOpen={!!accessBook}
        onClose={() => setAccessBook(null)}
        title="Kontrol Akses Buku"
        size="md"
      >
        {accessBook && (
          <BookAccessManager
            bookId={accessBook.id}
            bookTitle={accessBook.title}
            initialAccessType={accessBook.access_type ?? 'public'}
            onClose={() => { setAccessBook(null); fetchBooks() }}
          />
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteBook}
        onClose={() => setDeleteBook(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Buku"
        message={`Yakin ingin menghapus "${deleteBook?.title}"? File PDF dan data terkait akan ikut dihapus.`}
        confirmLabel="Ya, Hapus"
        danger
      />
    </div>
  )
}