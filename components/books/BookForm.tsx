'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Category, Book } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface BookFormProps {
  categories: Category[]
  initialData?: Book
  onSuccess: (book: Book) => void
  onCancel: () => void
}

export function BookForm({ categories, initialData, onSuccess, onCancel }: BookFormProps) {
  const isEdit = !!initialData

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [author, setAuthor] = useState(initialData?.author ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [year, setYear] = useState(initialData?.year?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? '')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_url ?? null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  // Dropzone untuk PDF
  const onDropPdf = useCallback((files: File[]) => {
    if (files[0]) setPdfFile(files[0])
  }, [])

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDrag } =
    useDropzone({
      onDrop: onDropPdf,
      accept: { 'application/pdf': ['.pdf'] },
      maxFiles: 1,
      maxSize: 50 * 1024 * 1024, // 50MB
    })

  // Dropzone untuk cover
  const onDropCover = useCallback((files: File[]) => {
    if (files[0]) {
      setCoverFile(files[0])
      setCoverPreview(URL.createObjectURL(files[0]))
    }
  }, [])

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDrag } =
    useDropzone({
      onDrop: onDropCover,
      accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEdit && !pdfFile) {
      toast.error('File PDF wajib diunggah')
      return
    }

    setLoading(true)
    setUploadProgress('Mengunggah...')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('author', author)
      formData.append('description', description)
      formData.append('year', year)
      formData.append('categoryId', categoryId)
      if (pdfFile) formData.append('pdf', pdfFile)
      if (coverFile) formData.append('cover', coverFile)

      const url = isEdit
        ? `/api/admin/books/${initialData!.id}`
        : '/api/admin/books'
      const method = isEdit ? 'PUT' : 'POST'

      setUploadProgress(pdfFile ? 'Mengupload PDF (mungkin butuh beberapa saat)...' : 'Menyimpan...')

      const res = await fetch(url, { method, body: formData })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan buku')
      }

      toast.success(isEdit ? 'Buku berhasil diperbarui' : 'Buku berhasil diunggah')
      onSuccess(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Judul */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Judul Buku <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
          placeholder="Masukkan judul buku"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Penulis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Penulis <span className="text-red-500">*</span>
        </label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          disabled={loading}
          placeholder="Masukkan nama penulis"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Kategori & Tahun */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50"
          >
            <option value="">Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun Terbit</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={loading}
            placeholder="2024"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder="Deskripsi singkat buku ini..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 resize-none"
        />
      </div>

      {/* Upload PDF */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          File PDF {!isEdit && <span className="text-red-500">*</span>}
          {isEdit && <span className="text-gray-400 font-normal"> (kosongkan jika tidak ingin mengganti)</span>}
        </label>
        <div
          {...getPdfRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition',
            isPdfDrag
              ? 'border-blue-400 bg-blue-50'
              : pdfFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <input {...getPdfInputProps()} />
          {pdfFile ? (
            <div>
              <p className="text-2xl mb-1">📄</p>
              <p className="text-sm font-medium text-green-700">{pdfFile.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm text-gray-500">
                {isPdfDrag ? 'Lepaskan file di sini' : 'Drag & drop PDF atau klik untuk pilih'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Maksimal 50 MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Cover */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Cover Buku <span className="text-gray-400 font-normal">(opsional)</span>
        </label>
        <div className="flex gap-4 items-start">
          {/* Preview */}
          {coverPreview && (
            <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
            </div>
          )}
          <div
            {...getCoverRootProps()}
            className={cn(
              'flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition',
              isCoverDrag
                ? 'border-blue-400 bg-blue-50'
                : coverFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <input {...getCoverInputProps()} />
            <p className="text-2xl mb-1">🖼️</p>
            <p className="text-xs text-gray-500">
              {isCoverDrag
                ? 'Lepaskan gambar di sini'
                : coverFile
                ? coverFile.name
                : 'Drag & drop gambar atau klik'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — maks 5 MB</p>
          </div>
        </div>
      </div>

      {/* Upload progress info */}
      {uploadProgress && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-lg">
          <LoadingSpinner size="sm" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg
            hover:bg-gray-50 transition disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg
            hover:bg-blue-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" className="border-white" />}
          {isEdit ? 'Simpan Perubahan' : 'Upload Buku'}
        </button>
      </div>
    </form>
  )
}