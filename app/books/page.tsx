import { Suspense } from 'react'
import PublicBooksPage from './PublicBooksPage'

export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat katalog...</div>
      </div>
    }>
      <PublicBooksPage />
    </Suspense>
  )
}