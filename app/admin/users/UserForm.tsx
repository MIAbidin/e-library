'use client'

import { useState } from 'react'
import { User } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

interface UserFormProps {
  initialData?: User
  onSuccess: (user: User) => void
  onCancel: () => void
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? '')
  const [department, setDepartment] = useState(initialData?.department ?? '')
  const [role, setRole] = useState<'admin' | 'karyawan'>(initialData?.role ?? 'karyawan')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nama wajib diisi'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${initialData!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Data pengguna diperbarui')
      onSuccess(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  // Form edit saja — tidak ada tambah user manual dari admin
  // Karyawan daftar mandiri via /auth/register
  if (!isEdit) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-4xl">ℹ️</div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Pengguna baru dapat mendaftar secara mandiri melalui halaman{' '}
          <span className="font-medium text-blue-600">/auth/register</span>.
        </p>
        <p className="text-xs text-gray-400">
          Setelah mendaftar dan verifikasi email, akun akan muncul di daftar ini.
          Admin dapat mengubah role atau menonaktifkan akun dari halaman ini.
        </p>
        <button
          onClick={onCancel}
          className="w-full py-2.5 text-sm text-gray-600 border border-gray-200
            rounded-lg hover:bg-gray-50 transition"
        >
          Tutup
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info email — read only */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1.5">Email</label>
        <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
          text-sm text-gray-500">
          {initialData?.email}
        </div>
      </div>

      {/* Nama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          placeholder="Nama lengkap"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Departemen & Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Departemen
          </label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={loading}
            placeholder="Contoh: IT, Finance"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'karyawan')}
            disabled={loading}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50"
          >
            <option value="karyawan">👤 Karyawan</option>
            <option value="admin">👑 Admin</option>
          </select>
        </div>
      </div>

      {/* Warning ubah role ke admin */}
      {role === 'admin' && initialData?.role !== 'admin' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs text-yellow-700">
            ⚠️ Pengguna ini akan mendapat akses penuh ke panel admin,
            termasuk mengelola buku, user, dan seluruh sistem.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200
            rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 transition disabled:opacity-70
            flex items-center justify-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" className="border-white" />}
          Simpan Perubahan
        </button>
      </div>
    </form>
  )
}