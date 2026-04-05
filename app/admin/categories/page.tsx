'use client'

import { useState, useEffect, useCallback } from 'react'
import { Category } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

interface CategoryWithCount extends Category {
  book_count: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editCat, setEditCat] = useState<CategoryWithCount | null>(null)
  const [deleteCat, setDeleteCat] = useState<CategoryWithCount | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data ?? [])
    } catch {
      toast.error('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const openAdd = () => {
    setEditCat(null)
    setName('')
    setDesc('')
    setShowForm(true)
  }

  const openEdit = (cat: CategoryWithCount) => {
    setEditCat(cat)
    setName(cat.name)
    setDesc(cat.description ?? '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nama kategori wajib diisi'); return }
    setSaving(true)
    try {
      const url = editCat ? `/api/admin/categories/${editCat.id}` : '/api/admin/categories'
      const method = editCat ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editCat ? 'Kategori diperbarui' : 'Kategori ditambahkan')
      setShowForm(false)
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCat) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleteCat.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Kategori dihapus')
      setDeleteCat(null)
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kategori"
        description={`${categories.length} kategori terdaftar`}
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
              text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            + Tambah Kategori
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
                  {cat.book_count} buku
                </span>
              </div>
              {cat.description && (
                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{cat.description}</p>
              )}
              <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(cat)}
                  className="flex-1 text-xs text-blue-600 border border-blue-200
                    rounded-lg py-1.5 hover:bg-blue-50 transition font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteCat(cat)}
                  disabled={cat.book_count > 0}
                  className="flex-1 text-xs text-red-600 border border-red-200
                    rounded-lg py-1.5 hover:bg-red-50 transition font-medium
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  title={cat.book_count > 0 ? 'Tidak bisa hapus kategori yang memiliki buku' : ''}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editCat ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Leadership & Management"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Deskripsi singkat kategori ini"
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200
                rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg
                hover:bg-blue-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" className="border-white" />}
              {editCat ? 'Simpan' : 'Tambahkan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${deleteCat?.name}"?`}
        confirmLabel="Ya, Hapus"
        danger
      />
    </div>
  )
}