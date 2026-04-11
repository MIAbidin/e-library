'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Category } from '@/types'

interface SearchAndFilterProps {
  categories: Category[]
  /** Override base path dan params ekstra (e.g. view=catalog) */
  basePath?: string
  extraParams?: Record<string, string>
}

export function SearchAndFilter({ categories, basePath, extraParams }: SearchAndFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')
  const [showFilters, setShowFilters] = useState(false)

  const resolvedBase = basePath ?? '/dashboard'

  const updateParams = useCallback(
    (s: string, c: string, so: string) => {
      const params = new URLSearchParams()
      if (s.trim()) params.set('search', s.trim())
      if (c) params.set('category', c)
      if (so !== 'newest') params.set('sort', so)
      params.set('page', '1')
      // Tambahkan extra params (e.g. view=catalog)
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => params.set(k, v))
      }
      router.push(`${resolvedBase}?${params.toString()}`)
    },
    [router, resolvedBase, extraParams]
  )

  useEffect(() => {
    const t = setTimeout(() => updateParams(search, category, sort), 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    updateParams(search, val, sort)
  }

  const handleSortChange = (val: string) => {
    setSort(val)
    updateParams(search, category, val)
  }

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    const params = new URLSearchParams()
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v))
    }
    router.push(`${resolvedBase}?${params.toString()}`)
  }

  const hasActiveFilter = search || category || sort !== 'newest'
  const activeFilterCount = [search, category, sort !== 'newest' ? sort : ''].filter(Boolean).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 mb-4 lg:mb-6">
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau penulis..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter toggle — mobile */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`lg:hidden flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-lg
            transition font-medium flex-shrink-0
            ${showFilters || hasActiveFilter
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop filters */}
        <div className="hidden lg:flex gap-2">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[160px]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[140px]"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="title_asc">Judul A-Z</option>
            <option value="title_desc">Judul Z-A</option>
          </select>
          {hasActiveFilter && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border
                border-gray-200 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Mobile expanded filters */}
      {showFilters && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="title_asc">Judul A-Z</option>
              <option value="title_desc">Judul Z-A</option>
            </select>
            {hasActiveFilter && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200
                  rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}