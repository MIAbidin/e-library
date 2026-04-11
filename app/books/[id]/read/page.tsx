import { createAdminClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { notFound, redirect } from 'next/navigation'
import { checkBookAccess } from '@/lib/book-access'
import { PDFViewerWrapper } from '@/components/PDFViewerWrapper'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function PublicReadPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { page } = await searchParams

  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const { data: book, error } = await supabase
    .from('books')
    .select('id, title, file_url, total_pages, access_type')
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

  if (!access.canRead) {
    if (access.reason === 'login_required') {
      redirect(`/auth/login?callbackUrl=/books/${id}`)
    }
    redirect(`/books/${id}`)  // tampilkan pesan "akses ditolak" di halaman detail
  }

  if (!book.file_url) notFound()

  // Generate signed URL (1 jam)
  const { data: signedUrl } = await supabase.storage
    .from('books')
    .createSignedUrl(book.file_url, 3600)

  if (!signedUrl?.signedUrl) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d0d0d', color: 'rgba(255,255,255,0.6)',
        fontFamily: 'monospace', flexDirection: 'column', gap: 16,
      }}>
        <span style={{ fontSize: 40 }}>📄</span>
        <p>Gagal mengakses file. Coba lagi nanti.</p>
        <a href={`/books/${id}`} style={{ color: '#3b82f6' }}>← Kembali</a>
      </div>
    )
  }

  const initialPage = parseInt(page ?? '1')

  return (
    <PDFViewerWrapper
      fileUrl={signedUrl.signedUrl}
      bookId={book.id}
      bookTitle={book.title}
      initialPage={initialPage}
      totalPages={book.total_pages}
      // Jika tidak login, bookId masih bisa dipakai tapi stats tidak tersimpan
      // (API /api/books/[id]/read-history sudah handle unauthorized)
    />
  )
}