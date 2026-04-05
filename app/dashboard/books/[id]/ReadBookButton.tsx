'use client'

import { useRouter } from 'next/navigation'

interface ReadBookButtonProps {
  bookId: string
  lastPage: number
  progress: number
}

export function ReadBookButton({ bookId, lastPage, progress }: ReadBookButtonProps) {
  const router = useRouter()

  const handleRead = () => {
    router.push(`/dashboard/books/${bookId}/read?page=${lastPage}`)
  }

  return (
    <button
      onClick={handleRead}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
        text-white font-medium px-6 py-3 rounded-xl transition shadow-sm text-sm"
    >
      📖
      {progress > 0 && progress < 100
        ? `Lanjut Membaca (Hal. ${lastPage})`
        : progress === 100
        ? 'Baca Ulang'
        : 'Mulai Membaca'}
    </button>
  )
}