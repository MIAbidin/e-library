// app/dashboard/books/[id]/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ReadBookButton } from './ReadBookButton'
import { checkBookAccess } from '@/lib/book-access'

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ access?: string }>
}) {
  const { id } = await params
  const { access: accessQuery } = await searchParams

  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const { data: book, error } = await supabase
    .from('books')
    .select('*, category:categories(id, name), access_type')
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  // ✅ Cek apakah user boleh membaca buku ini
  const access = await checkBookAccess(
    book.id,
    session!.user.id,
    session!.user.role,
    session!.user.department
  )

  const { data: history } = await supabase
    .from('read_history')
    .select('last_page, last_read_at')
    .eq('user_id', session!.user.id)
    .eq('book_id', id)
    .maybeSingle()

  const lastPage = history?.last_page ?? 1
  const progress = book.total_pages > 0
    ? Math.round((lastPage / book.total_pages) * 100)
    : 0

  const accessDenied = !access.canRead || accessQuery === 'denied'

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        ← Kembali ke Katalog
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Cover */}
          <div className="md:w-64 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="relative w-full aspect-[3/4] md:h-full md:min-h-[320px]">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 256px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-7xl">📗</span>
                </div>
              )}

              {/* Access badge */}
              <div className="absolute top-3 left-3">
                {book.access_type === 'restricted' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold
                    bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    🔒 Akses Terbatas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold
                    bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                    🌐 Publik
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-8">
            {book.category && (
              <Badge variant="blue" className="mb-3">
                {book.category.name}
              </Badge>
            )}

            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
              {book.title}
            </h1>
            <p className="text-gray-500 font-medium mb-4">{book.author}</p>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
              {book.year && (
                <div>
                  <span className="text-gray-400">Tahun Terbit</span>
                  <p className="font-medium text-gray-700">{book.year}</p>
                </div>
              )}
              {book.total_pages > 0 && (
                <div>
                  <span className="text-gray-400">Jumlah Halaman</span>
                  <p className="font-medium text-gray-700">{book.total_pages} halaman</p>
                </div>
              )}
              <div>
                <span className="text-gray-400">Ditambahkan</span>
                <p className="font-medium text-gray-700">{formatDate(book.created_at)}</p>
              </div>
              {history?.last_read_at && (
                <div>
                  <span className="text-gray-400">Terakhir Dibaca</span>
                  <p className="font-medium text-gray-700">{formatDate(history.last_read_at)}</p>
                </div>
              )}
            </div>

            {/* Progress bar — hanya tampil jika punya akses */}
            {access.canRead && progress > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Progress membaca</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {progress}% ({lastPage}/{book.total_pages} hal)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Deskripsi
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* ✅ CTA berdasarkan status akses */}
            {accessDenied ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Akses Ditolak</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      Buku ini hanya dapat diakses oleh pengguna atau departemen tertentu.
                      Hubungi Administrator jika Anda merasa seharusnya memiliki akses.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ReadBookButton
                bookId={book.id}
                lastPage={lastPage}
                progress={progress}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}