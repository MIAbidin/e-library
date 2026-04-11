'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    // Preserve view param jika ada (untuk dashboard catalog mode)
    const view = searchParams.get('view')
    if (view) params.set('view', view)

    // Tentukan base path dari URL saat ini
    const basePath = window.location.pathname
    router.push(`${basePath}?${params.toString()}`)
  }

  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600
          hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Prev
      </button>

      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            className={cn(
              'w-9 h-9 text-sm rounded-lg border transition font-medium',
              page === currentPage
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600
          hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Next →
      </button>
    </div>
  )
}