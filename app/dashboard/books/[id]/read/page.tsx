// app/dashboard/books/[id]/read/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PDFViewerWrapper } from '@/components/PDFViewerWrapper'
import Link from 'next/link'

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
    .select('id, title, file_url, total_pages')
    .eq('id', id)
    .single()

  if (error || !book) notFound()

  if (!book.file_url) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl mb-4">File PDF tidak tersedia</p>
          <Link href={`/dashboard/books/${id}`} className="text-blue-400 hover:underline">
            Kembali ke detail buku
          </Link>
        </div>
      </div>
    )
  }

  const { data: signedUrl } = await supabase.storage
    .from('books')
    .createSignedUrl(book.file_url, 60 * 60)

  if (!signedUrl?.signedUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Gagal mengakses file. Coba lagi nanti.</p>
      </div>
    )
  }

  const initialPage = parseInt(page ?? '1')
  const isAdmin = session.user.role === 'admin'

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="bg-gray-950 text-white px-4 py-2 flex items-center justify-between flex-shrink-0">
        <Link
          href={`/dashboard/books/${book.id}`}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          ← Kembali
        </Link>
        <h1 className="text-sm font-medium text-gray-200 truncate max-w-xs sm:max-w-md text-center">
          {book.title}
        </h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-hidden">
        <PDFViewerWrapper
          fileUrl={signedUrl.signedUrl}
          bookId={book.id}
          initialPage={initialPage}
          totalPages={book.total_pages}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}