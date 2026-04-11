import { createAdminClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { checkBookAccess } from '@/lib/book-access'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicBookDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const { data: book, error } = await supabase
    .from('books')
    .select('id, title, author, description, year, total_pages, cover_url, access_type, created_at, category:categories(id, name)')
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  // Cek akses
  const access = await checkBookAccess(
    book.id,
    session?.user?.id ?? null,
    session?.user?.role ?? null,
    session?.user?.department ?? null
  )

  // Progress jika sudah login & punya akses
  let lastPage = 1
  let progress = 0
  if (session && access.canRead) {
    const { data: history } = await supabase
      .from('read_history')
      .select('last_page')
      .eq('user_id', session.user.id)
      .eq('book_id', id)
      .maybeSingle()
    lastPage = history?.last_page ?? 1
    progress = book.total_pages > 0 ? Math.round((lastPage / book.total_pages) * 100) : 0
  }

  const categoryName = (book.category as any)?.name ?? null
  const isRestricted = book.access_type === 'restricted'
  const needLogin = !session && isRestricted

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/books" className="flex items-center gap-2.5 font-bold text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">📚</div>
            <span className="hidden sm:block">E-Library Perusahaan</span>
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href={session.user.role === 'admin' ? '/admin' : '/dashboard'}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Masuk</Link>
                <Link href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <Link href="/books"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          ← Kembali ke Katalog
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Cover */}
            <div className="md:w-64 flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="relative w-full aspect-[3/4] md:h-full md:min-h-[340px]">
                {book.cover_url ? (
                  <Image src={book.cover_url} alt={book.title} fill className="object-cover"
                    sizes="(max-width: 768px) 100vw, 256px" priority />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl">📗</span>
                  </div>
                )}
                {/* Access badge */}
                <div className="absolute top-3 left-3">
                  {isRestricted ? (
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
            <div className="flex-1 p-6 lg:p-8">
              {categoryName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                  font-medium bg-blue-100 text-blue-700 mb-3">
                  {categoryName}
                </span>
              )}

              <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">{book.title}</h1>
              <p className="text-gray-500 font-medium mb-5">{book.author}</p>

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
              </div>

              {/* Progress */}
              {session && access.canRead && progress > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Progress membaca</span>
                    <span className="text-xs font-semibold text-blue-600">
                      {progress}% ({lastPage}/{book.total_pages} hal)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Description */}
              {book.description && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deskripsi</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
                </div>
              )}

              {/* ── CTA berdasarkan kondisi akses ── */}
              <AccessCTA
                bookId={book.id}
                access={access}
                session={session}
                lastPage={lastPage}
                progress={progress}
                isRestricted={isRestricted}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 mt-10 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} E-Library Perusahaan. Confidential.
      </footer>
    </div>
  )
}

// ── Sub-component CTA ──────────────────────────────────────────────────────
function AccessCTA({
  bookId, access, session, lastPage, progress, isRestricted
}: {
  bookId: string
  access: { canRead: boolean; reason: string }
  session: any
  lastPage: number
  progress: number
  isRestricted: boolean
}) {
  // Bisa baca
  if (access.canRead) {
    const readUrl = session
      ? `/dashboard/books/${bookId}/read?page=${lastPage}`
      : `/books/${bookId}/read?page=1`   // tamu baca via public reader

    return (
      <div className="space-y-3">
        <Link
          href={readUrl}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white font-medium px-6 py-3 rounded-xl transition shadow-sm text-sm"
        >
          📖 {progress > 0 && progress < 100
            ? `Lanjut Membaca (Hal. ${lastPage})`
            : progress === 100 ? 'Baca Ulang'
            : 'Baca Sekarang'}
        </Link>
        {!session && !isRestricted && (
          <p className="text-xs text-gray-400">
            <Link href={`/auth/login?callbackUrl=/books/${bookId}`} className="text-blue-600 hover:underline">
              Login
            </Link>{' '}
            untuk menyimpan progres bacaan Anda.
          </p>
        )}
      </div>
    )
  }

  // Butuh login
  if (access.reason === 'login_required') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Perlu Login</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Buku ini memerlukan login untuk dibaca. Silakan masuk dengan akun perusahaan Anda.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/auth/login?callbackUrl=/books/${bookId}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white font-medium px-5 py-2.5 rounded-lg transition text-sm"
          >
            Masuk untuk Membaca
          </Link>
          <Link href="/auth/register" className="text-sm text-blue-600 hover:underline font-medium">
            Daftar gratis →
          </Link>
        </div>
      </div>
    )
  }

  // Tidak punya akses (sudah login tapi tidak diizinkan)
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚫</span>
        <div>
          <p className="text-sm font-semibold text-red-800">Akses Ditolak</p>
          <p className="text-sm text-red-700 mt-0.5">
            Buku ini hanya dapat diakses oleh pengguna atau departemen tertentu.
            Hubungi Administrator jika Anda merasa seharusnya memiliki akses.
          </p>
          <Link href="/books"
            className="inline-block mt-3 text-sm text-red-600 hover:underline font-medium">
            ← Kembali ke katalog
          </Link>
        </div>
      </div>
    </div>
  )
}