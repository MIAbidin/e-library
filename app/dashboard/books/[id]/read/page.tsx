// app/dashboard/books/[id]/read/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PDFViewerWrapper } from '@/components/PDFViewerWrapper'
import { checkBookAccess } from '@/lib/book-access'

interface PageProps {
  params: { id: string } | Promise<{ id: string }>
  searchParams: { page?: string } | Promise<{ page?: string }>
}

export default async function ReadBookPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { page } = await searchParams

  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const supabase = createAdminClient()

  const { data: book, error } = await supabase
    .from('books')
    .select('id, title, file_url, total_pages, access_type')
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  // ✅ Cek apakah user boleh membaca buku ini
  const access = await checkBookAccess(
    book.id,
    session.user.id,
    session.user.role,
    session.user.department
  )

  if (!access.canRead) {
    redirect(`/dashboard/books/${id}?access=denied`)
  }

  if (!book.file_url) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0d0d0d', color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace', flexDirection: 'column', gap: 16,
        }}
      >
        <span style={{ fontSize: 40 }}>📄</span>
        <p>File PDF tidak tersedia</p>
        <a href={`/dashboard/books/${id}`} style={{ color: '#3b82f6' }}>← Kembali</a>
      </div>
    )
  }

  const { data: signedUrl } = await supabase.storage
    .from('books')
    .createSignedUrl(book.file_url, 60 * 60)

  if (!signedUrl?.signedUrl) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0d0d0d', color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
        }}
      >
        Gagal mengakses file. Coba lagi nanti.
      </div>
    )
  }

  const initialPage = parseInt(page ?? '1')
  const isAdmin = session.user.role === 'admin'

  return (
    <PDFViewerWrapper
      fileUrl={signedUrl.signedUrl}
      bookId={book.id}
      bookTitle={book.title}
      initialPage={initialPage}
      totalPages={book.total_pages}
      isAdmin={isAdmin}
    />
  )
}