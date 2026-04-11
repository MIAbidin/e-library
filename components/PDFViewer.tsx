'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PDFViewerProps {
  fileUrl: string
  bookId: string
  initialPage?: number
  totalPages?: number
  bookTitle?: string
  isAdmin?: boolean
}

type Theme = 'dark' | 'sepia' | 'light'
type FontSize = 'sm' | 'md' | 'lg' | 'xl'

const THEMES: Record<Theme, { bg: string; pageBg: string; label: string; text: string }> = {
  dark:  { bg: '#0d0d0d',  pageBg: '#1a1a1a', label: 'Malam', text: '#e8e0d0' },
  sepia: { bg: '#1c1510',  pageBg: '#f4ead8', label: 'Sepia', text: '#3d2b1a' },
  light: { bg: '#f0ede8',  pageBg: '#ffffff', label: 'Terang', text: '#1a1a1a' },
}

const SCALES: Record<FontSize, number> = {
  sm: 0.75,
  md: 1.0,
  lg: 1.25,
  xl: 1.5,
}

export function PDFViewer({
  fileUrl,
  bookId,
  initialPage = 1,
  totalPages: knownTotalPages,
  bookTitle = 'Dokumen',
  isAdmin = false,
}: PDFViewerProps) {
  const [numPages, setNumPages]         = useState(knownTotalPages ?? 0)
  const [currentPage, setCurrentPage]   = useState(initialPage)
  const [scale, setScale]               = useState<FontSize>('md')
  const [theme, setTheme]               = useState<Theme>('dark')
  const [uiVisible, setUiVisible]       = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [goToInput, setGoToInput]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [pageLoaded, setPageLoaded]     = useState(false)
  const [containerWidth, setContainerWidth] = useState(700)

  const containerRef        = useRef<HTMLDivElement>(null)
  const hideTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionStartPageRef = useRef(initialPage)
  const sessionStartTimeRef = useRef(Date.now())
  const lastMoveRef         = useRef(0)

  const t = THEMES[theme]
  const scaleVal = SCALES[scale]
  const progress = numPages > 0 ? (currentPage / numPages) * 100 : 0

  // ── Responsive width ─────────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setContainerWidth(Math.max(300, w - 48))
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Auto-hide UI ──────────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    if (settingsOpen) return
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setUiVisible(true)
    hideTimerRef.current = setTimeout(() => {
      if (!settingsOpen) setUiVisible(false)
    }, 3500)
  }, [settingsOpen])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [resetHideTimer])

  const handleMouseMove = useCallback(() => {
    const now = Date.now()
    if (now - lastMoveRef.current < 60) return
    lastMoveRef.current = now
    resetHideTimer()
  }, [resetHideTimer])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        changePage(currentPage + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        changePage(currentPage - 1)
      } else if (e.key === 'Escape') {
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, numPages])

  // ── Save read history ─────────────────────────────────────────────────────
  const saveReadHistory = useCallback((page: number) => {
    if (saveHistoryTimerRef.current) clearTimeout(saveHistoryTimerRef.current)
    saveHistoryTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/books/${bookId}/read-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastPage: page }),
        })
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [bookId])

  // ── Flush session ─────────────────────────────────────────────────────────
  const flushSession = useCallback(async (endPage: number) => {
    const startPage = sessionStartPageRef.current
    const durationSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
    if (durationSeconds < 5 || endPage < startPage) return
    try {
      await fetch('/api/stats/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, startPage, endPage, durationSeconds }),
      })
    } catch { /* silent */ }
  }, [bookId])

  useEffect(() => {
    const handleUnload = () => {
      if (saveHistoryTimerRef.current) clearTimeout(saveHistoryTimerRef.current)
      navigator.sendBeacon(`/api/books/${bookId}/read-history`, JSON.stringify({ lastPage: currentPage }))
      const dur = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      if (dur >= 5) {
        navigator.sendBeacon('/api/stats/session', JSON.stringify({
          bookId, startPage: sessionStartPageRef.current, endPage: currentPage, durationSeconds: dur,
        }))
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => { window.removeEventListener('beforeunload', handleUnload); handleUnload() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, currentPage])

  // ── Change page ───────────────────────────────────────────────────────────
  const changePage = useCallback(async (next: number) => {
    if (next < 1 || next > numPages) return
    await flushSession(currentPage)
    sessionStartPageRef.current = next
    sessionStartTimeRef.current = Date.now()
    setPageLoaded(false)
    setCurrentPage(next)
    saveReadHistory(next)
    containerRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentPage, numPages, flushSession, saveReadHistory])

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(goToInput)
    if (!isNaN(p)) { changePage(p); setGoToInput('') }
  }

  // ── Cycle theme ───────────────────────────────────────────────────────────
  const cycleTheme = () => {
    const order: Theme[] = ['dark', 'sepia', 'light']
    const i = order.indexOf(theme)
    setTheme(order[(i + 1) % order.length])
  }

  // ── Zoom buttons ──────────────────────────────────────────────────────────
  const zoomOut = () => { const o: FontSize[] = ['sm','md','lg','xl']; const i=o.indexOf(scale); if(i>0) setScale(o[i-1]) }
  const zoomIn  = () => { const o: FontSize[] = ['sm','md','lg','xl']; const i=o.indexOf(scale); if(i<o.length-1) setScale(o[i+1]) }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        .reader-root {
          position: fixed; inset: 0;
          background: ${t.bg};
          display: flex; flex-direction: column;
          overflow: hidden;
          transition: background 0.4s ease;
          font-family: 'Lora', Georgia, serif;
        }

        /* ── Top bar ── */
        .reader-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          z-index: 50;
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          background: linear-gradient(to bottom, ${t.bg}ee 60%, transparent);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-topbar.hidden {
          opacity: 0; pointer-events: none;
          transform: translateY(-8px);
        }

        .reader-back {
          display: flex; align-items: center; gap: 8px;
          color: ${theme === 'light' ? '#555' : 'rgba(255,255,255,0.55)'};
          text-decoration: none;
          font-size: 13px; font-family: 'JetBrains Mono', monospace;
          padding: 6px 12px; border-radius: 8px;
          transition: background 0.2s, color 0.2s;
          border: 1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
          background: ${theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'};
        }
        .reader-back:hover {
          color: ${theme === 'light' ? '#111' : 'rgba(255,255,255,0.9)'};
          background: ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'};
        }

        .reader-title {
          font-size: 13px;
          color: ${theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'};
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.04em;
          max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .reader-controls {
          display: flex; align-items: center; gap: 6px;
        }

        .ctrl-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          background: ${theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'};
          color: ${theme === 'light' ? '#555' : 'rgba(255,255,255,0.6)'};
          cursor: pointer; font-size: 14px;
          transition: all 0.15s;
        }
        .ctrl-btn:hover {
          background: ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'};
          color: ${theme === 'light' ? '#111' : '#fff'};
          transform: scale(1.05);
        }
        .ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        /* ── Progress strip ── */
        .reader-progress {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px; z-index: 100;
          background: ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};
        }
        .reader-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
          border-radius: 0 2px 2px 0;
        }

        /* ── PDF scroll area ── */
        .reader-body {
          flex: 1;
          overflow-y: auto; overflow-x: hidden;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 72px 24px 100px;
          scroll-behavior: smooth;
          position: relative;
        }
        .reader-body::-webkit-scrollbar { width: 4px; }
        .reader-body::-webkit-scrollbar-track { background: transparent; }
        .reader-body::-webkit-scrollbar-thumb {
          background: ${theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'};
          border-radius: 2px;
        }

        /* ── Page wrapper ── */
        .page-wrapper {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.3),
            0 16px 48px rgba(0,0,0,0.35),
            0 40px 80px rgba(0,0,0,0.2);
          transition: opacity 0.3s ease;
          background: ${t.pageBg};
        }
        .page-wrapper.loading-page { opacity: 0.4; }

        /* ── Bottom bar ── */
        .reader-bottombar {
          position: absolute; bottom: 0; left: 0; right: 0;
          z-index: 50;
          height: 60px;
          display: flex; align-items: center; justify-content: center;
          gap: 0;
          background: linear-gradient(to top, ${t.bg}ee 60%, transparent);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-bottombar.hidden {
          opacity: 0; pointer-events: none;
          transform: translateY(8px);
        }

        .bottom-inner {
          display: flex; align-items: center; gap: 8px;
          background: ${theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.92)'};
          border: 1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          border-radius: 14px;
          padding: 8px 12px;
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }

        .page-nav-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          color: ${theme === 'light' ? '#555' : 'rgba(255,255,255,0.7)'};
          background: transparent;
          cursor: pointer; font-size: 16px;
          transition: all 0.15s;
          border: none;
          user-select: none;
        }
        .page-nav-btn:hover:not(:disabled) {
          background: ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          color: ${theme === 'light' ? '#111' : '#fff'};
        }
        .page-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        .page-input-wrap {
          display: flex; align-items: center; gap: 6px;
        }

        .page-input {
          width: 42px; height: 34px;
          text-align: center;
          background: ${theme === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'};
          border: 1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          border-radius: 6px;
          color: ${theme === 'light' ? '#111' : '#fff'};
          font-size: 13px; font-family: 'JetBrains Mono', monospace;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s;
        }
        .page-input:focus {
          border-color: #3b82f6;
        }

        .page-sep {
          color: ${theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'};
          font-size: 12px; font-family: 'JetBrains Mono', monospace;
        }

        .page-total {
          color: ${theme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'};
          font-size: 12px; font-family: 'JetBrains Mono', monospace;
          min-width: 28px;
        }

        .divider-v {
          width: 1px; height: 20px;
          background: ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
          margin: 0 4px;
        }

        .pct-badge {
          font-size: 11px; font-family: 'JetBrains Mono', monospace;
          color: #3b82f6;
          background: rgba(59,130,246,0.12);
          padding: 2px 8px; border-radius: 100px;
          font-weight: 500;
        }

        /* ── Settings Panel ── */
        .settings-panel {
          position: absolute; top: 64px; right: 16px;
          width: 220px;
          background: ${theme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(22,22,22,0.98)'};
          border: 1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          backdrop-filter: blur(20px);
          z-index: 200;
          animation: panelIn 0.2s ease;
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .settings-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${theme === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'};
          margin-bottom: 8px; font-family: 'JetBrains Mono', monospace;
        }

        .settings-row {
          margin-bottom: 16px;
        }

        .theme-btns {
          display: flex; gap: 6px;
        }

        .theme-btn {
          flex: 1; padding: 8px 4px; border-radius: 8px;
          font-size: 11px; font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.15s;
          text-align: center;
        }
        .theme-btn.active { border-color: #3b82f6; }

        .size-btns {
          display: flex; gap: 4px;
        }

        .size-btn {
          flex: 1; padding: 8px 0; border-radius: 8px;
          font-family: 'Lora', serif;
          cursor: pointer;
          border: 1.5px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          background: ${theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};
          color: ${theme === 'light' ? '#555' : 'rgba(255,255,255,0.6)'};
          transition: all 0.15s;
          text-align: center;
        }
        .size-btn.active {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.1);
          color: #3b82f6;
        }
        .size-btn:hover:not(.active) {
          background: ${theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          color: ${theme === 'light' ? '#111' : '#fff'};
        }

        .saving-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3b82f6;
          animation: pulse 1.2s ease infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 0.4; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }

        /* ── Loading skeleton ── */
        .page-skeleton {
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 16px;
        }
        .skeleton-spinner {
          width: 32px; height: 32px;
          border: 2px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton-label {
          font-size: 12px; font-family: 'JetBrains Mono', monospace;
          color: ${theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'};
          letter-spacing: 0.06em;
        }

        /* ── Page turn anim ── */
        .page-fade { animation: pageFade 0.25s ease; }
        @keyframes pageFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Touch swipe hint */
        @media (max-width: 640px) {
          .reader-topbar { padding: 0 12px; }
          .reader-title { display: none; }
          .reader-body { padding: 64px 12px 88px; }
          .bottom-inner { padding: 6px 8px; gap: 4px; }
          .settings-panel { right: 8px; left: 8px; width: auto; }
        }
      `}</style>

      <div
        className="reader-root"
        onMouseMove={handleMouseMove}
        onClick={() => { if (!settingsOpen) resetHideTimer() }}
        style={{ cursor: uiVisible ? 'default' : 'none' }}
      >
        {/* Progress strip */}
        <div className="reader-progress">
          <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Top bar */}
        <div className={`reader-topbar ${!uiVisible ? 'hidden' : ''}`}>
          <a href={`/dashboard/books/${bookId}`} className="reader-back">
            ← Kembali
          </a>

          <span className="reader-title">{bookTitle}</span>

          <div className="reader-controls">
            {saving && <div className="saving-dot" title="Menyimpan..." />}

            {/* Zoom out */}
            <button
              className="ctrl-btn"
              onClick={zoomOut}
              disabled={scale === 'sm'}
              title="Perkecil"
              style={{ fontSize: 16, fontFamily: 'JetBrains Mono' }}
            >A₋</button>

            {/* Zoom in */}
            <button
              className="ctrl-btn"
              onClick={zoomIn}
              disabled={scale === 'xl'}
              title="Perbesar"
              style={{ fontSize: 16, fontFamily: 'JetBrains Mono' }}
            >A₊</button>

            {/* Theme toggle */}
            <button
              className="ctrl-btn"
              onClick={cycleTheme}
              title={`Tema: ${t.label}`}
            >
              {theme === 'dark' ? '🌙' : theme === 'sepia' ? '☕' : '☀️'}
            </button>

            {/* Settings */}
            <button
              className="ctrl-btn"
              onClick={() => { setSettingsOpen(s => !s); setUiVisible(true); if(hideTimerRef.current) clearTimeout(hideTimerRef.current) }}
              title="Pengaturan"
            >⚙</button>
          </div>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <div className="settings-panel">
            {/* Theme */}
            <div className="settings-row">
              <div className="settings-label">Tema</div>
              <div className="theme-btns">
                {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([k, v]) => (
                  <button
                    key={k}
                    className={`theme-btn ${theme === k ? 'active' : ''}`}
                    style={{
                      background: v.bg,
                      color: v.text,
                      borderColor: theme === k ? '#3b82f6' : v.bg === '#f0ede8' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
                    }}
                    onClick={() => setTheme(k)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="settings-row" style={{ marginBottom: 0 }}>
              <div className="settings-label">Ukuran Teks</div>
              <div className="size-btns">
                {([['sm','S'],['md','M'],['lg','L'],['xl','XL']] as [FontSize,string][]).map(([k, label]) => (
                  <button
                    key={k}
                    className={`size-btn ${scale === k ? 'active' : ''}`}
                    style={{ fontSize: k === 'sm' ? 11 : k === 'md' ? 13 : k === 'lg' ? 15 : 17 }}
                    onClick={() => setScale(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PDF body */}
        <div
          ref={containerRef}
          className="reader-body"
          onClick={() => setSettingsOpen(false)}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={(err) => console.error('PDF error:', err)}
            loading={
              <div
                className="page-skeleton"
                style={{ width: Math.min(containerWidth * scaleVal, containerWidth), minHeight: 500 }}
              >
                <div className="skeleton-spinner" />
                <div className="skeleton-label">Memuat dokumen…</div>
              </div>
            }
            error={
              <div
                className="page-skeleton"
                style={{ width: Math.min(containerWidth * scaleVal, containerWidth), minHeight: 400 }}
              >
                <div style={{ fontSize: 40 }}>📄</div>
                <div className="skeleton-label" style={{ color: '#ef4444' }}>Gagal memuat PDF</div>
              </div>
            }
          >
            <div
              className={`page-wrapper ${!pageLoaded ? 'loading-page' : 'page-fade'}`}
              style={{ background: t.pageBg }}
            >
              <Page
                pageNumber={currentPage}
                width={Math.min(containerWidth * scaleVal, containerWidth)}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onRenderSuccess={() => setPageLoaded(true)}
                loading={
                  <div
                    style={{
                      width: Math.min(containerWidth * scaleVal, containerWidth),
                      height: Math.min(containerWidth * scaleVal, containerWidth) * 1.414,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: t.pageBg,
                    }}
                  >
                    <div className="skeleton-spinner" />
                  </div>
                }
              />
            </div>
          </Document>
        </div>

        {/* Bottom navigation */}
        <div className={`reader-bottombar ${!uiVisible ? 'hidden' : ''}`}>
          <div className="bottom-inner">
            {/* First page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(1)}
              disabled={currentPage === 1}
              title="Halaman pertama"
              style={{ fontSize: 12, width: 28 }}
            >⏮</button>

            {/* Prev */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              title="Sebelumnya (←)"
            >‹</button>

            {/* Page input */}
            <form onSubmit={handleGoTo} className="page-input-wrap">
              <input
                className="page-input"
                type="number"
                value={goToInput}
                onChange={e => setGoToInput(e.target.value)}
                placeholder={String(currentPage)}
                min={1}
                max={numPages}
                onFocus={() => { if(hideTimerRef.current) clearTimeout(hideTimerRef.current) }}
                onBlur={resetHideTimer}
              />
              <span className="page-sep">/</span>
              <span className="page-total">{numPages || '…'}</span>
            </form>

            <div className="divider-v" />

            <span className="pct-badge">{Math.round(progress)}%</span>

            <div className="divider-v" />

            {/* Next */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === numPages}
              title="Berikutnya (→)"
            >›</button>

            {/* Last page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(numPages)}
              disabled={currentPage === numPages}
              title="Halaman terakhir"
              style={{ fontSize: 12, width: 28 }}
            >⏭</button>
          </div>
        </div>
      </div>
    </>
  )
}