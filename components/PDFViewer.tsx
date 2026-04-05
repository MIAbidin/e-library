'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFViewerProps {
  fileUrl: string
  bookId: string
  initialPage?: number
  totalPages?: number
  isAdmin?: boolean
}

export function PDFViewer({
  fileUrl,
  bookId,
  initialPage = 1,
  totalPages: knownTotalPages,
  isAdmin = false,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(knownTotalPages ?? 0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [scale, setScale] = useState(1.0)
  const [goToInput, setGoToInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [containerWidth, setContainerWidth] = useState(800)

  const containerRef = useRef<HTMLDivElement>(null)
  const saveHistoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Session tracking
  const sessionStartPageRef = useRef<number>(initialPage)
  const sessionStartTimeRef = useRef<number>(Date.now())

  // ===== Responsif width =====
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // ===== Simpan read_history (posisi terakhir) =====
  const saveReadHistory = useCallback(
    (page: number) => {
      if (saveHistoryTimeoutRef.current) {
        clearTimeout(saveHistoryTimeoutRef.current)
      }
      saveHistoryTimeoutRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await fetch(`/api/books/${bookId}/read-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lastPage: page }),
          })
        } catch (err) {
          console.error('Gagal simpan read history:', err)
        } finally {
          setSaving(false)
        }
      }, 2000)
    },
    [bookId]
  )

  // ===== Kirim sesi baca ke API =====
  const flushSession = useCallback(
    async (endPage: number) => {
      const startPage = sessionStartPageRef.current
      const durationSeconds = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      )

      // Minimal 5 detik dan minimal 1 halaman dibaca
      if (durationSeconds < 5 || endPage < startPage) return

      try {
        await fetch('/api/stats/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            startPage,
            endPage,
            durationSeconds,
          }),
        })
      } catch (err) {
        console.error('Gagal kirim sesi baca:', err)
      }
    },
    [bookId]
  )

  // ===== Flush session saat unmount / tab ditutup =====
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Simpan read history via beacon
      if (saveHistoryTimeoutRef.current) clearTimeout(saveHistoryTimeoutRef.current)
      navigator.sendBeacon(
        `/api/books/${bookId}/read-history`,
        JSON.stringify({ lastPage: currentPage })
      )

      // Kirim sesi terakhir via beacon
      const durationSeconds = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      )
      if (durationSeconds >= 5) {
        navigator.sendBeacon(
          '/api/stats/session',
          JSON.stringify({
            bookId,
            startPage: sessionStartPageRef.current,
            endPage: currentPage,
            durationSeconds,
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Flush saat komponen unmount (navigasi SPA)
      handleBeforeUnload()
    }
  }, [bookId, currentPage])

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const changePage = async (newPage: number) => {
    if (newPage < 1 || newPage > numPages) return

    // Flush sesi yang sedang berjalan sebelum pindah halaman
    await flushSession(currentPage)

    // Reset tracker untuk sesi baru
    sessionStartPageRef.current = newPage
    sessionStartTimeRef.current = Date.now()

    setCurrentPage(newPage)
    saveReadHistory(newPage)
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(goToInput)
    if (!isNaN(page)) {
      changePage(page)
      setGoToInput('')
    }
  }

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5))
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5))
  const resetZoom = () => setScale(1.0)

  const progressPercent = numPages > 0
    ? Math.round((currentPage / numPages) * 100)
    : 0

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* ===== TOP TOOLBAR ===== */}
      <div className="bg-gray-900 text-white px-3 lg:px-4 py-2 flex items-center
        justify-between gap-2 lg:gap-4 flex-shrink-0 shadow-lg">

        {/* Navigasi halaman */}
        <div className="flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => changePage(1)}
            disabled={currentPage === 1}
            className="hidden sm:flex p-1.5 rounded hover:bg-gray-700
              disabled:opacity-40 transition text-sm"
            title="Halaman pertama"
          >
            ⏮
          </button>
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition"
            title="Sebelumnya"
          >
            ←
          </button>

          <form onSubmit={handleGoTo} className="flex items-center gap-1">
            <input
              type="number"
              value={goToInput}
              onChange={(e) => setGoToInput(e.target.value)}
              placeholder={String(currentPage)}
              min={1}
              max={numPages}
              className="w-10 lg:w-14 text-center bg-gray-700 text-white
                text-xs lg:text-sm py-1 px-1 lg:px-2 rounded border border-gray-600
                focus:outline-none focus:border-blue-400"
            />
            <span className="text-gray-400 text-xs lg:text-sm">
              / {numPages || '?'}
            </span>
          </form>

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === numPages}
            className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition"
            title="Berikutnya"
          >
            →
          </button>
          <button
            onClick={() => changePage(numPages)}
            disabled={currentPage === numPages}
            className="hidden sm:flex p-1.5 rounded hover:bg-gray-700
              disabled:opacity-40 transition text-sm"
            title="Halaman terakhir"
          >
            ⏭
          </button>
        </div>

        {/* Progress — hidden di mobile */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
          <div className="w-20 lg:w-24 bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>{progressPercent}%</span>
        </div>

        {/* Zoom + saving indicator */}
        <div className="flex items-center gap-1">
          {saving && (
            <span className="text-xs text-gray-400 mr-1 hidden lg:inline">
              Menyimpan…
            </span>
          )}
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40
              transition text-xs"
            title="Perkecil"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600
              transition min-w-[44px] text-center"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-1.5 rounded hover:bg-gray-700 disabled:opacity-40
              transition text-xs"
            title="Perbesar"
          >
            +
          </button>
        </div>
      </div>

      {/* Progress bar strip */}
      <div className="h-1 bg-gray-700 flex-shrink-0">
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ===== PDF CONTENT ===== */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="flex justify-center py-6 px-6 min-h-full">
          <Document
            file={fileUrl}
            onLoadSuccess={handleDocumentLoad}
            onLoadError={(err) => console.error('PDF load error:', err)}
            loading={
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <LoadingSpinner size="lg" className="border-gray-400" />
                <p className="text-gray-400 text-sm">Memuat dokumen...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center
                py-20 text-center">
                <span className="text-5xl mb-4">😕</span>
                <p className="text-gray-300 font-medium">Gagal memuat PDF</p>
                <p className="text-gray-500 text-sm mt-1">
                  Coba muat ulang halaman ini
                </p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              width={
                containerWidth * scale > containerWidth
                  ? undefined
                  : containerWidth
              }
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div
                  className="flex items-center justify-center"
                  style={{ width: containerWidth, height: 500 }}
                >
                  <LoadingSpinner size="lg" className="border-gray-400" />
                </div>
              }
              className="shadow-2xl"
            />
          </Document>
        </div>
      </div>

      {/* ===== BOTTOM NAV MOBILE ===== */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between
        sm:hidden flex-shrink-0">
        <button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 text-sm text-white disabled:opacity-40
            bg-gray-700 px-4 py-2 rounded-lg transition hover:bg-gray-600"
        >
          ← Prev
        </button>
        <div className="text-center">
          <span className="text-xs text-gray-400">
            {currentPage} / {numPages}
          </span>
          <div className="w-16 bg-gray-700 rounded-full h-1 mt-1">
            <div
              className="bg-blue-400 h-1 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === numPages}
          className="flex items-center gap-1.5 text-sm text-white disabled:opacity-40
            bg-gray-700 px-4 py-2 rounded-lg transition hover:bg-gray-600"
        >
          Next →
        </button>
      </div>
    </div>
  )
}