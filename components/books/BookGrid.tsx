import { Book } from '@/types'
import { BookCard } from './BookCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface BookGridProps {
  books: Book[]
  loading?: boolean
  readHistory?: Record<string, number>
  emptyMessage?: string
}

export function BookGrid({
  books,
  loading = false,
  readHistory = {},
  emptyMessage = 'Belum ada buku tersedia.',
}: BookGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 lg:py-20">
        <span className="text-4xl lg:text-5xl">📭</span>
        <p className="text-gray-500 mt-4 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    // Mobile: 2 kolom | sm: 3 | lg: 4 | xl: 5
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          lastPage={readHistory[book.id]}
        />
      ))}
    </div>
  )
}