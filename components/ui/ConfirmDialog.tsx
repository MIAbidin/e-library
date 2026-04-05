'use client'

import { Modal } from './Modal'
import { LoadingSpinner } from './LoadingSpinner'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 text-sm mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg
            hover:bg-gray-50 transition disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm text-white rounded-lg transition
            flex items-center gap-2 disabled:opacity-70
            ${danger
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading && <LoadingSpinner size="sm" className="border-white" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}