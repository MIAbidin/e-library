import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  // Ambil semua statistik sekaligus (parallel)
  const [
    { count: totalBooks },
    { count: totalUsers },
    { count: totalCategories },
    { data: recentBooks },
    { data: popularCategories },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase
      .from('books')
      .select('id, title, author, cover_url, created_at, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('categories')
      .select('id, name, books(count)')
      .order('name')
      .limit(6),
  ])

  const stats = [
    { label: 'Total Buku', value: totalBooks ?? 0, icon: '📗', color: 'blue', href: '/admin/books' },
    { label: 'Total Pengguna', value: totalUsers ?? 0, icon: '👥', color: 'indigo', href: '/admin/users' },
    { label: 'Kategori', value: totalCategories ?? 0, icon: '🏷️', color: 'purple', href: '/admin/categories' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Admin
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Selamat datang, {session?.user?.name}. Berikut ringkasan sistem hari ini.
        </p>
      </div>

      {/* Stat Cards — 1 kolom di mobile, 3 di desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5
              hover:shadow-md transition group flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
              <div className={`inline-flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11
                rounded-xl text-lg lg:text-xl sm:mb-4 ${colorMap[stat.color]}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buku Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Buku Terbaru Ditambahkan</h2>
            <Link href="/admin/books" className="text-sm text-blue-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentBooks?.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                Belum ada buku
              </div>
            )}
            {recentBooks?.map((book) => (
              <div key={book.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition">
                <div className="w-9 h-12 rounded overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      width={36}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base">📗</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                  <p className="text-xs text-gray-400">{book.author}</p>
                </div>
                <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
                  {formatDate(book.created_at, { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              {[
                { href: '/admin/books', icon: '📤', label: 'Upload Buku Baru', desc: 'Tambah koleksi baru' },
                { href: '/admin/users', icon: '👤', label: 'Tambah Pengguna', desc: 'Undang karyawan' },
                { href: '/admin/notifications', icon: '📢', label: 'Buat Pengumuman', desc: 'Kirim notifikasi' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Distribusi Kategori */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Buku per Kategori</h2>
            <div className="space-y-2">
              {popularCategories?.map((cat) => {
                const count = (cat.books as unknown as { count: number }[])?.[0]?.count ?? 0
                const pct = totalBooks ? Math.round((count / totalBooks) * 100) : 0
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate">{cat.name}</span>
                      <span className="text-gray-400 ml-2 flex-shrink-0">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {(popularCategories?.length ?? 0) === 0 && (
                <p className="text-xs text-gray-400">Belum ada data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}