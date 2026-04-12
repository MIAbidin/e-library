'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

interface StatsOverview {
  totalBooksRead: number
  totalBooksCompleted: number
  totalPagesRead: number
  totalMinutesRead: number
  streak: number
}

interface ActivityData {
  date: string
  pages: number
  minutes: number
}

interface BookInProgress {
  last_page: number
  last_read_at: string
  progress: number
  book: {
    id: string
    title: string
    author: string
    cover_url: string | null
    total_pages: number
    category: { name: string } | null
  }
}

interface BookCompleted {
  completed_at: string
  book: {
    id: string
    title: string
    author: string
    cover_url: string | null
    category: { name: string } | null
  }
}

type ChartMetric = 'pages' | 'minutes'

export default function StatsPage() {
  const searchParams = useSearchParams()
  const defaultTab = (searchParams.get('tab') as 'progress' | 'completed') ?? 'progress'

  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [activity, setActivity] = useState<ActivityData[]>([])
  const [books, setBooks] = useState<{
    inProgress: BookInProgress[]
    completed: BookCompleted[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'progress' | 'completed'>(defaultTab)
  const [chartDays, setChartDays] = useState(7)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('pages')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [overviewRes, activityRes, booksRes] = await Promise.all([
          fetch('/api/stats/me'),
          fetch(`/api/stats/me/activity?days=${chartDays}`),
          fetch('/api/stats/me/books'),
        ])
        setOverview(await overviewRes.json())
        setActivity(await activityRes.json())
        setBooks(await booksRes.json())
      } catch (err) {
        console.error('Gagal memuat statistik:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [chartDays])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return chartDays <= 7
      ? d.toLocaleDateString('id-ID', { weekday: 'short' })
      : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mnt`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}j ${m}mnt` : `${h} jam`
  }

  const hasActivity = activity.some((d) => d.pages > 0 || d.minutes > 0)

  const summaryCards = [
    {
      label: 'Buku Dibuka',
      value: overview?.totalBooksRead ?? 0,
      icon: '📖',
    },
    {
      label: 'Buku Selesai',
      value: overview?.totalBooksCompleted ?? 0,
      icon: '✅',
    },
    {
      label: 'Total Halaman',
      value: (overview?.totalPagesRead ?? 0).toLocaleString('id-ID'),
      icon: '📄',
    },
    {
      label: 'Waktu Baca',
      value: formatDuration(overview?.totalMinutesRead ?? 0),
      icon: '⏱️',
    },
    {
      label: 'Streak Hari',
      value: `${overview?.streak ?? 0} hari`,
      icon: '🔥',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Statistik Saya 📊</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau aktivitas dan progres membaca kamu</p>
      </div>

      {/* ── KARTU RINGKASAN ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── GRAFIK AKTIVITAS ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800">Aktivitas Membaca</h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setChartMetric('pages')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  chartMetric === 'pages'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Halaman
              </button>
              <button
                onClick={() => setChartMetric('minutes')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                  chartMetric === 'minutes'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Menit
              </button>
            </div>

            {/* Days toggle */}
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    chartDays === d
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {d}H
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasActivity ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-3">📚</span>
            <p className="text-gray-400 text-sm">
              Belum ada aktivitas membaca dalam {chartDays} hari terakhir
            </p>
            <Link
              href="/dashboard"
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Mulai membaca sekarang →
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={activity.map((d) => ({
                ...d,
                label: formatChartDate(d.date),
              }))}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
                formatter={(value) => [
                  value ?? 0,
                  chartMetric === 'pages' ? 'Halaman' : 'Menit',
                ]}
                labelFormatter={(label) => `Tanggal: ${label}`}
              />
              <Bar
                dataKey={chartMetric}
                fill={chartMetric === 'pages' ? '#3b82f6' : '#f59e0b'}
                radius={[4, 4, 0, 0]}
                name={chartMetric}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Summary bawah chart */}
        {hasActivity && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">Total halaman ({chartDays}H)</p>
              <p className="text-sm font-semibold text-gray-800">
                {activity.reduce((s, d) => s + d.pages, 0).toLocaleString('id-ID')} hal
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total waktu ({chartDays}H)</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDuration(activity.reduce((s, d) => s + d.minutes, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Rata-rata/hari</p>
              <p className="text-sm font-semibold text-gray-800">
                {Math.round(
                  activity.reduce((s, d) => s + d.pages, 0) / chartDays
                )}{' '}
                hal
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── DAFTAR BUKU ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab */}
        <div className="flex border-b border-gray-200">
          {[
            {
              key: 'progress' as const,
              label: 'Sedang Dibaca',
              count: books?.inProgress.length ?? 0,
            },
            {
              key: 'completed' as const,
              label: 'Selesai Dibaca',
              count: books?.completed.length ?? 0,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="divide-y divide-gray-50">
          {activeTab === 'progress' && (
            <>
              {(books?.inProgress.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <span className="text-3xl">📖</span>
                  <p className="text-gray-400 text-sm mt-2">Belum ada buku yang sedang dibaca</p>
                  <Link
                    href="/dashboard"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Jelajahi koleksi buku →
                  </Link>
                </div>
              ) : (
                books?.inProgress.map((item) => (
                  <Link
                    key={item.book.id}
                    href={`/dashboard/books/${item.book.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                      {item.book.cover_url ? (
                        <Image
                          src={item.book.cover_url}
                          alt={item.book.title}
                          width={48}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          📗
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.book.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.book.author}</p>
                      {item.book.category && (
                        <span className="inline-block mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {item.book.category.name}
                        </span>
                      )}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>
                            Hal. {item.last_page} / {item.book.total_pages}
                          </span>
                          <span className="font-semibold text-blue-600">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-white bg-blue-600 px-3 py-1.5 rounded-lg font-medium">
                        Lanjut →
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {(books?.completed.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <span className="text-3xl">🏆</span>
                  <p className="text-gray-400 text-sm mt-2">Belum ada buku yang selesai dibaca</p>
                </div>
              ) : (
                books?.completed.map((item) => (
                  <Link
                    key={item.book.id}
                    href={`/dashboard/books/${item.book.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0">
                      {item.book.cover_url ? (
                        <Image
                          src={item.book.cover_url}
                          alt={item.book.title}
                          width={48}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          ✅
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {item.book.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.book.author}</p>
                      {item.book.category && (
                        <span className="inline-block mt-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {item.book.category.name}
                        </span>
                      )}
                      <p className="text-xs text-green-600 mt-1.5 font-medium">
                        ✅ Selesai{' '}
                        {formatDate(item.completed_at, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                  </Link>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}