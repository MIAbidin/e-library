import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface BookCardProps {
  book: Book
  lastPage?: number
}

export function BookCard({ book, lastPage }: BookCardProps) {
  const progress = book.total_pages > 0 && lastPage
    ? Math.round((lastPage / book.total_pages) * 100)
    : null

  return (
    <Link href={`/dashboard/books/${book.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer h-full flex flex-col">
        {/* Cover */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 aspect-[3/4] overflow-hidden">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-5xl mb-2">📗</span>
              <p className="text-xs text-indigo-400 font-medium line-clamp-2">
                {book.title}
              </p>
            </div>
          )}

          {/* Progress badge */}
          {progress !== null && progress > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                {progress === 100 ? '✅ Selesai' : `${progress}%`}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2 truncate">{book.author}</p>

          <div className="mt-auto flex items-center justify-between">
            {book.category && (
              <Badge variant="blue" className="text-xs">
                {book.category.name}
              </Badge>
            )}
            {book.year && (
              <span className="text-xs text-gray-400">{book.year}</span>
            )}
          </div>

          {/* Progress bar */}
          {progress !== null && progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}