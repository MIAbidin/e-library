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
  const progress =
    book.total_pages > 0 ? Math.round((lastPage / book.total_pages) * 100) : 0

  // Buku serupa — kategori sama, exclude buku ini, max 4
  const relatedBooksQuery = book.category_id
    ? supabase
        .from('books')
        .select('id, title, author, cover_url')
        .eq('category_id', book.category_id)
        .neq('id', id)
        .limit(4)
    : null

  const { data: relatedBooks } = relatedBooksQuery
    ? await relatedBooksQuery
    : { data: [] }

  // Read history untuk buku serupa (progress badge)
  const relatedIds = (relatedBooks ?? []).map((b) => b.id)
  const { data: relatedHistory } = relatedIds.length > 0
    ? await supabase
        .from('read_history')
        .select('book_id, last_page')
        .eq('user_id', session!.user.id)
        .in('book_id', relatedIds)
    : { data: [] }

  const relatedProgressMap: Record<string, number> = {}
  ;(relatedHistory ?? []).forEach((h) => {
    relatedProgressMap[h.book_id] = h.last_page
  })

  const accessDenied = !access.canRead || accessQuery === 'denied'
  const category = book.category as { id: string; name: string } | null

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        ← Kembali ke Katalog
      </Link>

      {/* ── MAIN CARD ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Cover */}
          <div className="md:w-60 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="relative w-full aspect-[3/4] md:h-full md:min-h-[320px]">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 240px"
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
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    🔒 Akses Terbatas
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
                    🌐 Publik
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-6 lg:p-8">
            {category && (
              <Badge variant="blue" className="mb-3">
                {category.name}
              </Badge>
            )}

            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{book.title}</h1>
            <p className="text-gray-500 font-medium mb-5">{book.author}</p>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
              {book.year && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Tahun Terbit</span>
                  <p className="font-medium text-gray-700 mt-0.5">{book.year}</p>
                </div>
              )}
              {book.total_pages > 0 && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Jumlah Halaman</span>
                  <p className="font-medium text-gray-700 mt-0.5">{book.total_pages} halaman</p>
                </div>
              )}
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wider">Ditambahkan</span>
                <p className="font-medium text-gray-700 mt-0.5">{formatDate(book.created_at)}</p>
              </div>
              {history?.last_read_at && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Terakhir Dibaca</span>
                  <p className="font-medium text-gray-700 mt-0.5">{formatDate(history.last_read_at)}</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
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
                {progress === 100 && (
                  <p className="text-xs text-green-600 font-medium mt-1.5">
                    ✅ Kamu sudah menyelesaikan buku ini!
                  </p>
                )}
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

            {/* CTA */}
            {accessDenied ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Akses Ditolak</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      Buku ini hanya dapat diakses oleh pengguna atau departemen tertentu. Hubungi
                      Administrator jika kamu merasa seharusnya memiliki akses.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <ReadBookButton bookId={book.id} lastPage={lastPage} progress={progress} />
                {progress > 0 && progress < 100 && (
                  <Link
                    href={`/dashboard/books/${book.id}/read?page=1`}
                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    Mulai dari awal
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BUKU SERUPA ── */}
      {(relatedBooks ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              📚 Buku Lain dalam Kategori &ldquo;{category?.name}&rdquo;
            </h2>
            <Link
              href={`/dashboard?view=catalog&category=${book.category_id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(relatedBooks ?? []).map((related) => {
              const relLastPage = relatedProgressMap[related.id]
              const relProgress =
                relLastPage ? Math.round((relLastPage / 1) * 100) : null
              // Note: relProgress tidak bisa dihitung akurat tanpa total_pages,
              // tapi kita tetap tampilkan badge "Sudah dibaca" jika ada history

              return (
                <Link key={related.id} href={`/dashboard/books/${related.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer h-full flex flex-col">
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4] overflow-hidden">
                      {related.cover_url ? (
                        <Image
                          src={related.cover_url}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          📗
                        </div>
                      )}
                      {relatedProgressMap[related.id] && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                            📖 Dibaca
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                        {related.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{related.author}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}