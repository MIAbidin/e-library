'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { UserForm } from './UserForm'
import { UserDetailModal } from './UserDetailModal'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterActive, setFilterActive] = useState('')

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [toggleUser, setToggleUser] = useState<User | null>(null)
  const [toggling, setToggling] = useState(false)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)

  // Ambil daftar departemen unik dari users
  const [departments, setDepartments] = useState<string[]>([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(filterRole && { role: filterRole }),
        ...(filterDept && { department: filterDept }),
        ...(filterActive && { is_active: filterActive }),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)

      // Kumpulkan departemen unik
      const depts = [...new Set(
        (data.users ?? [])
          .map((u: User) => u.department)
          .filter(Boolean)
      )] as string[]
      if (depts.length > 0) setDepartments((prev) => [...new Set([...prev, ...depts])])
    } catch {
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterRole, filterDept, filterActive])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleToggleActive = async () => {
    if (!toggleUser) return
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/users/${toggleUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toggleUser.name,
          department: toggleUser.department,
          role: toggleUser.role,
          is_active: !toggleUser.is_active,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(
        toggleUser.is_active
          ? `Akun ${toggleUser.name} dinonaktifkan`
          : `Akun ${toggleUser.name} diaktifkan kembali`
      )
      setToggleUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status')
    } finally {
      setToggling(false)
    }
  }

  const handleResetPassword = async (userId: string, userName: string) => {
    setResettingPassword(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Email reset password dikirim ke ${userName}`)

      // Development: tampilkan URL di console
      if (data.resetUrl) {
        console.info('Reset URL (dev only):', data.resetUrl)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim reset password')
    } finally {
      setResettingPassword(null)
    }
  }

  const handleExport = () => {
    window.open('/api/admin/users/export', '_blank')
  }

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    if (key === 'role') setFilterRole(value)
    if (key === 'dept') setFilterDept(value)
    if (key === 'active') setFilterActive(value)
  }

  const hasFilter = search || filterRole || filterDept || filterActive
  const resetFilters = () => {
    setSearch('')
    setFilterRole('')
    setFilterDept('')
    setFilterActive('')
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Manajemen User"
        description={`${total} pengguna terdaftar`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm
                text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl transition shadow-sm"
            >
              <span>+</span>
              <span className="hidden sm:inline">Tambah Pengguna</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 lg:p-4 mb-4 space-y-3">
        {/* Row 1: Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="karyawan">Karyawan</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => handleFilterChange('dept', e.target.value)}
            className="flex-1 min-w-[130px] px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterActive}
            onChange={(e) => handleFilterChange('active', e.target.value)}
            className="flex-1 min-w-[110px] px-3 py-2 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>

          {hasFilter && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-200
                rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table + Card Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">👥</span>
            <p className="text-gray-500 mt-3 text-sm">
              {hasFilter ? 'Tidak ada pengguna yang cocok dengan filter' : 'Belum ada pengguna'}
            </p>
          </div>
        ) : (
          <>
            {/* ===== DESKTOP TABLE ===== */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Departemen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Login Terakhir
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      {/* Avatar + nama */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center
                            justify-center text-sm font-semibold text-blue-700 flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'admin' ? 'blue' : 'gray'}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Karyawan'}
                        </Badge>
                      </td>

                      {/* Departemen */}
                      <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {user.department ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={user.is_active ? 'green' : 'red'}>
                          {user.is_active ? '● Aktif' : '○ Nonaktif'}
                        </Badge>
                      </td>

                      {/* Login terakhir */}
                      <td className="px-6 py-4 text-sm text-gray-400 hidden lg:table-cell">
                        {formatRelativeTime(user.last_login_at)}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          <button
                            onClick={() => setDetailUser(user)}
                            className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200
                              rounded-lg hover:bg-gray-50 transition font-medium"
                            title="Lihat detail"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => setEditUser(user)}
                            className="px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200
                              rounded-lg hover:bg-blue-50 transition font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id, user.name)}
                            disabled={resettingPassword === user.id}
                            className="px-2.5 py-1.5 text-xs text-yellow-600 border border-yellow-200
                              rounded-lg hover:bg-yellow-50 transition font-medium disabled:opacity-50"
                            title="Reset password"
                          >
                            {resettingPassword === user.id ? '...' : '🔑'}
                          </button>
                          <button
                            onClick={() => setToggleUser(user)}
                            className={`px-2.5 py-1.5 text-xs rounded-lg border transition font-medium
                              ${user.is_active
                                ? 'text-red-600 border-red-200 hover:bg-red-50'
                                : 'text-green-600 border-green-200 hover:bg-green-50'
                              }`}
                          >
                            {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== MOBILE CARD LIST ===== */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  {/* Header card */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center
                      justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <Badge variant={user.is_active ? 'green' : 'red'}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={user.role === 'admin' ? 'blue' : 'gray'}>
                          {user.role === 'admin' ? 'Admin' : 'Karyawan'}
                        </Badge>
                        {user.department && (
                          <span className="text-xs text-gray-400">{user.department}</span>
                        )}
                      </div>
                      {user.last_login_at && (
                        <p className="text-xs text-gray-300 mt-1">
                          Login: {formatRelativeTime(user.last_login_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    <button
                      onClick={() => setDetailUser(user)}
                      className="py-2 text-xs text-gray-600 border border-gray-200
                        rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => setEditUser(user)}
                      className="py-2 text-xs text-blue-600 border border-blue-200
                        rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id, user.name)}
                      disabled={resettingPassword === user.id}
                      className="py-2 text-xs text-yellow-600 border border-yellow-200
                        rounded-lg hover:bg-yellow-50 transition font-medium disabled:opacity-50"
                    >
                      {resettingPassword === user.id ? '...' : '🔑 Reset'}
                    </button>
                    <button
                      onClick={() => setToggleUser(user)}
                      className={`py-2 text-xs rounded-lg border transition font-medium
                        ${user.is_active
                          ? 'text-red-600 border-red-200 hover:bg-red-50'
                          : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}
                    >
                      {user.is_active ? 'Nonaktif' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-gray-100
            flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {page}/{totalPages}
              <span className="hidden sm:inline"> halaman</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                  hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                  hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Tambah User */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Tambah Pengguna Baru"
        size="md"
      >
        <UserForm
          onSuccess={() => { setShowAddForm(false); fetchUsers() }}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit User */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit Pengguna"
        size="md"
      >
        {editUser && (
          <UserForm
            initialData={editUser}
            onSuccess={() => { setEditUser(null); fetchUsers() }}
            onCancel={() => setEditUser(null)}
          />
        )}
      </Modal>

      {/* Detail User */}
      <UserDetailModal
        user={detailUser}
        onClose={() => setDetailUser(null)}
      />

      {/* Konfirmasi Toggle Aktif */}
      <ConfirmDialog
        isOpen={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={handleToggleActive}
        loading={toggling}
        title={toggleUser?.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
        message={
          toggleUser?.is_active
            ? `Yakin ingin menonaktifkan akun "${toggleUser?.name}"? Pengguna tidak akan bisa login.`
            : `Aktifkan kembali akun "${toggleUser?.name}"? Pengguna bisa login seperti biasa.`
        }
        confirmLabel={toggleUser?.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        danger={toggleUser?.is_active}
      />
    </div>
  )
}