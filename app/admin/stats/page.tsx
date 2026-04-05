'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import Image from 'next/image'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatRelativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'

interface Overview {
  totalUsers: number
  totalActiveUsers: number
  totalBooks: number
  totalSessions: number
  topBooks: { count: number; book: { id: string; title: string; author: string; cover_url: string | null } }[]
  weeklyActivity: { date: string; pages: number; minutes: number }[]
}

interface UserStat {
  id: string
  name: string
  email: string
  department: string | null
  last_login_at: string | null
  stats: {
    booksRead: number
    booksCompleted: number
    pagesRead: number
    minutesRead: number
  }
}

export default function AdminStatsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [userStats, setUserStats] = useState<UserStat[]>([])
  const [totalUserPages, setTotalUserPages] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const fetchOverview = async () => {
    setLoadingOverview(true)
    try {
      const res = await fetch('/api/admin/stats/overview')
      setOverview(await res.json())
    } catch (err) {
      console.error('Gagal memuat overview:', err)
    } finally {
      setLoadingOverview(false)
    }
  }

  const fetchUserStats = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch(
        `/api/admin/stats/users?page=${userPage}&limit=10`
      )
      const data = await res.json()
      setUserStats(data.users ?? [])
      setTotalUserPages(data.totalPages ?? 1)
    } catch (err) {
      console.error('Gagal memuat user stats:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [userPage])

  useEffect(() => { fetchOverview() }, [])
  useEffect(() => { fetchUserStats() }, [fetchUserStats])

  const handleExport = () => {
    window.open('/api/admin/stats/export', '_blank')
  }

  const formatChartDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'short',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistik Sistem"
        description="Pantau aktivitas membaca seluruh pengguna"
        action={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              text-gray-600 border border-gray-200 rounded-xl
              hover:bg-gray-50 transition"
          >
            📥 Export CSV
          </button>
        }
      />

      {/* ===== STAT CARDS ===== */}
      {loadingOverview ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              {
                label: 'Total Pengguna',
                value: overview?.totalUsers ?? 0,
                sub: `${overview?.totalActiveUsers ?? 0} aktif`,
                icon: '👥',
              },
              {
                label: 'Total Buku',
                value: overview?.totalBooks ?? 0,
                icon: '📗',
              },
              {
                label: 'Total Sesi Baca',
                value: overview?.totalSessions ?? 0,
                icon: '📖',
              },
              {
                label: 'Buku Terpopuler',
                value: overview?.topBooks?.[0]?.book?.title
                  ? `${overview.topBooks[0].count}x`
                  : '—',
                sub: overview?.topBooks?.[0]?.book?.title ?? 'Belum ada data',
                icon: '🏆',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                {stat.sub && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{stat.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* ===== GRAFIK AKTIVITAS MINGGUAN ===== */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
              Aktivitas 7 Hari Terakhir (Semua Pengguna)
            </h2>
            {(overview?.weeklyActivity ?? []).every((d) => d.pages === 0) ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Belum ada aktivitas membaca minggu ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={(overview?.weeklyActivity ?? []).map((d) => ({
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
                    formatter={(value, name) => [
                      value ?? 0,
                      name === 'pages' ? 'Halaman' : 'Menit',
                    ]}
                  />
                  <Bar
                    dataKey="pages"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="pages"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ===== TOP BUKU ===== */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">🏆 Buku Terpopuler</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(overview?.topBooks ?? []).length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">
                    Belum ada data
                  </p>
                ) : (
                  overview?.topBooks.map((item, index) => (
                    <div
                      key={item.book?.id ?? index}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span className="text-lg font-bold text-gray-300 w-6 text-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-9 h-12 rounded overflow-hidden
                        bg-blue-50 flex-shrink-0">
                        {item.book?.cover_url ? (
                          <Image
                            src={item.book.cover_url}
                            alt={item.book.title}
                            width={36}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center
                            justify-center text-base">📗</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {item.book?.title ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.book?.author}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600
                        bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.count}x
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Placeholder untuk konten tambahan */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">
                📈 Ringkasan Bulan Ini
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'Pengguna Aktif',
                    value: overview?.totalActiveUsers ?? 0,
                    icon: '👤',
                  },
                  {
                    label: 'Total Sesi Membaca',
                    value: overview?.totalSessions ?? 0,
                    icon: '📖',
                  },
                  {
                    label: 'Koleksi Buku',
                    value: overview?.totalBooks ?? 0,
                    icon: '📚',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between
                      p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TABEL STATISTIK PER USER ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center
          justify-between">
          <h2 className="font-semibold text-gray-800">
            Statistik per Pengguna
          </h2>
          <span className="text-xs text-gray-400">
            Halaman {userPage} / {totalUserPages}
          </span>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      'Pengguna', 'Departemen',
                      'Buku Dibaca', 'Buku Selesai',
                      'Total Halaman', 'Login Terakhir',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold
                          text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userStats.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {user.department ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">
                        {user.stats.booksRead}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">
                        {user.stats.booksCompleted}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">
                        {user.stats.pagesRead}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">
                        {formatRelativeTime(user.last_login_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-gray-100">
              {userStats.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex
                      items-center justify-center text-sm font-bold
                      text-blue-700 flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.department ?? 'No dept'} ·{' '}
                        {formatRelativeTime(user.last_login_at)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Dibaca', value: user.stats.booksRead },
                      { label: 'Selesai', value: user.stats.booksCompleted },
                      { label: 'Halaman', value: user.stats.pagesRead },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-gray-50 rounded-lg p-2 text-center"
                      >
                        <p className="text-base font-bold text-gray-900">
                          {s.value}
                        </p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalUserPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100
                flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {userPage} / {totalUserPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserPage((p) => p - 1)}
                    disabled={userPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200
                      rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setUserPage((p) => p + 1)}
                    disabled={userPage === totalUserPages}
                    className="px-3 py-1.5 text-sm border border-gray-200
                      rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}