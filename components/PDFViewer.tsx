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
  dark:  { bg: '#0d0d0d',  pageBg: '#1a1a1a', label: 'Malam',  text: '#e8e0d0' },
  sepia: { bg: '#1c1510',  pageBg: '#f4ead8', label: 'Sepia',  text: '#3d2b1a' },
  light: { bg: '#f0ede8',  pageBg: '#ffffff', label: 'Terang', text: '#1a1a1a' },
}

const SCALES: Record<FontSize, number> = {
  sm: 0.75, md: 1.0, lg: 1.25, xl: 1.5,
}

const FONT_SIZE_ORDER: FontSize[] = ['sm', 'md', 'lg', 'xl']

/** Minimum session duration (seconds) to be worth saving */
const MIN_SESSION_SECONDS = 3

export function PDFViewer({
  fileUrl,
  bookId,
  initialPage = 1,
  totalPages: knownTotalPages,
  bookTitle = 'Dokumen',
}: PDFViewerProps) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [numPages, setNumPages]           = useState(knownTotalPages ?? 0)
  const [currentPage, setCurrentPage]     = useState(initialPage)
  const [scale, setScale]                 = useState<FontSize>('md')
  const [theme, setTheme]                 = useState<Theme>('dark')
  const [uiVisible, setUiVisible]         = useState(true)
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [goToInput, setGoToInput]         = useState('')
  const [saving, setSaving]               = useState(false)
  const [pageLoaded, setPageLoaded]       = useState(false)
  const [containerWidth, setContainerWidth] = useState(700)
  const [turnDir, setTurnDir]             = useState<'left' | 'right' | null>(null)

  // ── Refs (avoid stale closures in event handlers) ─────────────────────────
  const containerRef        = useRef<HTMLDivElement>(null)
  const hideTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveHistoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoFlushInterval   = useRef<ReturnType<typeof setInterval> | null>(null)

  // Always-current page ref for use inside callbacks
  const currentPageRef = useRef(initialPage)

  // Session tracking refs
  const sessionStartPage  = useRef(initialPage)   // page where current session began
  const sessionMaxPage    = useRef(initialPage)    // furthest page reached this session
  const sessionStartTime  = useRef(Date.now())     // when current page was opened

  // Touch / gesture refs
  const touchStartX    = useRef<number | null>(null)
  const touchStartY    = useRef<number | null>(null)
  const touchStartTime = useRef(0)
  const pinchDist0     = useRef<number | null>(null)
  const pinchScale0    = useRef<FontSize>('md')

  // Mouse wheel accumulator refs
  const wheelAccRef   = useRef(0)
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Double-tap detection
  const lastTapRef = useRef(0)

  // Mouse move throttle
  const lastMoveRef = useRef(0)

  const t        = THEMES[theme]
  const scaleVal = SCALES[scale]
  const progress = numPages > 0 ? (currentPage / numPages) * 100 : 0

  // Keep currentPageRef in sync
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])

  // ── Measure container width ───────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current)
        setContainerWidth(Math.max(300, containerRef.current.clientWidth - 48))
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
    hideTimerRef.current = setTimeout(() => setUiVisible(false), 3500)
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

  // ── Save read history (debounced) ─────────────────────────────────────────
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

  // ── Send session to stats API ─────────────────────────────────────────────
  const sendSession = useCallback((sp: number, ep: number, dur: number) => {
    if (dur < MIN_SESSION_SECONDS) return
    fetch('/api/stats/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        startPage: sp,
        endPage: ep,
        durationSeconds: dur,
      }),
    }).catch(console.error)
  }, [bookId])

  // ── Auto-flush session every 60s (long reads on same page) ───────────────
  useEffect(() => {
    autoFlushInterval.current = setInterval(() => {
      const dur = Math.floor((Date.now() - sessionStartTime.current) / 1000)
      if (dur >= 30) {
        sendSession(sessionStartPage.current, sessionMaxPage.current, dur)
        // Reset timer, keep current position
        sessionStartTime.current = Date.now()
        sessionStartPage.current = currentPageRef.current
      }
    }, 60_000)
    return () => { if (autoFlushInterval.current) clearInterval(autoFlushInterval.current) }
  }, [sendSession])

  // ── Flush session on tab hide / page unload ───────────────────────────────
  useEffect(() => {
    const flush = () => {
      const dur  = Math.floor((Date.now() - sessionStartTime.current) / 1000)
      const page = currentPageRef.current

      // Save last page via Beacon (works even if tab is closing)
      navigator.sendBeacon(
        `/api/books/${bookId}/read-history`,
        JSON.stringify({ lastPage: page })
      )

      if (dur >= MIN_SESSION_SECONDS) {
        navigator.sendBeacon(
          '/api/stats/session',
          JSON.stringify({
            bookId,
            startPage: sessionStartPage.current,
            endPage: sessionMaxPage.current,
            durationSeconds: dur,
          })
        )
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush() // flush on component unmount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  // ── Change page (core) ────────────────────────────────────────────────────
  const changePage = useCallback((next: number, dir?: 'left' | 'right') => {
    if (next < 1 || (numPages > 0 && next > numPages)) return

    const prev = currentPageRef.current
    const dur  = Math.floor((Date.now() - sessionStartTime.current) / 1000)

    // Flush session for pages just read
    sendSession(sessionStartPage.current, sessionMaxPage.current, dur)

    // Start new session segment
    sessionStartPage.current = next
    sessionStartTime.current = Date.now()
    if (next > sessionMaxPage.current) sessionMaxPage.current = next

    setPageLoaded(false)
    setTurnDir(dir ?? (next > prev ? 'right' : 'left'))
    setCurrentPage(next)
    saveReadHistory(next)
    containerRef.current?.scrollTo({ top: 0, behavior: 'instant' })

    // Clear animation class after it finishes
    setTimeout(() => setTurnDir(null), 350)
  }, [numPages, sendSession, saveReadHistory])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (settingsOpen && e.key !== 'Escape') return

      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
          e.preventDefault()
          changePage(currentPageRef.current + 1, 'right')
          break
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          e.preventDefault()
          changePage(currentPageRef.current - 1, 'left')
          break
        case 'Home':
          e.preventDefault()
          changePage(1, 'left')
          break
        case 'End':
          e.preventDefault()
          changePage(numPages, 'right')
          break
        case 'Escape':
          setSettingsOpen(false)
          break
        case '+': case '=':
          e.preventDefault()
          setScale(s => {
            const i = FONT_SIZE_ORDER.indexOf(s)
            return i < FONT_SIZE_ORDER.length - 1 ? FONT_SIZE_ORDER[i + 1] : s
          })
          break
        case '-':
          e.preventDefault()
          setScale(s => {
            const i = FONT_SIZE_ORDER.indexOf(s)
            return i > 0 ? FONT_SIZE_ORDER[i - 1] : s
          })
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, settingsOpen])

  // ── Mouse wheel page turn ─────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return
    const el = containerRef.current
    if (!el) return

    wheelAccRef.current += e.deltaY

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    wheelTimerRef.current = setTimeout(() => {
      const acc = wheelAccRef.current
      wheelAccRef.current = 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
      const atTop    = el.scrollTop <= 8

      if (acc > 150 && atBottom) changePage(currentPageRef.current + 1, 'right')
      else if (acc < -150 && atTop) changePage(currentPageRef.current - 1, 'left')
    }, 80)
  }, [changePage])

  // ── Touch: swipe & pinch-zoom ─────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchDist0.current   = Math.hypot(dx, dy)
      pinchScale0.current  = scale
      return
    }
    touchStartX.current    = e.touches[0].clientX
    touchStartY.current    = e.touches[0].clientY
    touchStartTime.current = Date.now()
  }, [scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDist0.current !== null) {
      const dx    = e.touches[0].clientX - e.touches[1].clientX
      const dy    = e.touches[0].clientY - e.touches[1].clientY
      const ratio = Math.hypot(dx, dy) / pinchDist0.current
      const base  = FONT_SIZE_ORDER.indexOf(pinchScale0.current)

      if (ratio > 1.4 && base < FONT_SIZE_ORDER.length - 1)
        setScale(FONT_SIZE_ORDER[base + 1])
      else if (ratio < 0.7 && base > 0)
        setScale(FONT_SIZE_ORDER[base - 1])
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    pinchDist0.current = null

    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const dt = Date.now() - touchStartTime.current

    touchStartX.current = null
    touchStartY.current = null

    // Must be a fast, primarily horizontal swipe
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7 || dt > 500) return

    resetHideTimer()
    if (dx < 0) changePage(currentPageRef.current + 1, 'right')
    else         changePage(currentPageRef.current - 1, 'left')
  }, [changePage, resetHideTimer])

  // ── Double-tap to cycle zoom ──────────────────────────────────────────────
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setScale(s => {
        const i = FONT_SIZE_ORDER.indexOf(s)
        return i < FONT_SIZE_ORDER.length - 1 ? FONT_SIZE_ORDER[i + 1] : 'md'
      })
    }
    lastTapRef.current = now
  }, [])

  // ── Tap zone click (left 20% / right 20% of screen) ──────────────────────
  const handleBodyClick = useCallback((e: React.MouseEvent) => {
    if (settingsOpen) { setSettingsOpen(false); return }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width

    if (pct < 0.2)      changePage(currentPageRef.current - 1, 'left')
    else if (pct > 0.8) changePage(currentPageRef.current + 1, 'right')
    else                resetHideTimer()
  }, [settingsOpen, changePage, resetHideTimer])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(goToInput)
    if (!isNaN(p)) { changePage(p); setGoToInput('') }
  }

  const cycleTheme = () => {
    const order: Theme[] = ['dark', 'sepia', 'light']
    setTheme(order[(order.indexOf(theme) + 1) % order.length])
  }

  const zoomOut = () => setScale(s => {
    const i = FONT_SIZE_ORDER.indexOf(s)
    return i > 0 ? FONT_SIZE_ORDER[i - 1] : s
  })
  const zoomIn = () => setScale(s => {
    const i = FONT_SIZE_ORDER.indexOf(s)
    return i < FONT_SIZE_ORDER.length - 1 ? FONT_SIZE_ORDER[i + 1] : s
  })

  const pageWidth = Math.min(containerWidth * scaleVal, containerWidth)

  // ── Styles ────────────────────────────────────────────────────────────────
  const isLight = theme === 'light'
  const borderColor   = isLight ? 'rgba(0,0,0,0.1)'   : 'rgba(255,255,255,0.1)'
  const subtleBg      = isLight ? 'rgba(0,0,0,0.04)'  : 'rgba(255,255,255,0.04)'
  const subtleColor   = isLight ? '#555'               : 'rgba(255,255,255,0.6)'
  const monoFont      = "'JetBrains Mono', 'Fira Code', monospace"
  const serifFont     = "'Lora', Georgia, serif"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');

        /* ── Base reset ── */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        /* ── Reader root ── */
        .reader-root {
          position: fixed;
          inset: 0;
          background: ${t.bg};
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.4s ease;
          font-family: ${serifFont};
          z-index: 99999;
          touch-action: pan-y;
          user-select: none;
        }

        /* ── Progress strip ── */
        .reader-progress {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px; z-index: 100;
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};
        }
        .reader-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 2px 2px 0;
        }

        /* ── Top bar ── */
        .reader-topbar {
          position: absolute; top: 0; left: 0; right: 0;
          z-index: 50; height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          background: linear-gradient(to bottom, ${t.bg}f0 60%, transparent);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-topbar.hidden {
          opacity: 0; pointer-events: none; transform: translateY(-8px);
        }

        .reader-back {
          display: flex; align-items: center; gap: 8px;
          color: ${subtleColor};
          text-decoration: none;
          font-size: 13px; font-family: ${monoFont};
          padding: 6px 12px; border-radius: 8px;
          border: 1px solid ${borderColor};
          background: ${subtleBg};
          transition: background 0.2s, color 0.2s;
        }
        .reader-back:hover {
          color: ${isLight ? '#111' : 'rgba(255,255,255,0.9)'};
          background: ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'};
        }

        .reader-title {
          font-size: 13px;
          color: ${isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'};
          font-family: ${monoFont};
          letter-spacing: 0.04em;
          max-width: 260px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .reader-controls { display: flex; align-items: center; gap: 6px; }

        .ctrl-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid ${borderColor};
          background: ${subtleBg};
          color: ${subtleColor};
          cursor: pointer; font-size: 14px;
          transition: all 0.15s;
        }
        .ctrl-btn:hover {
          background: ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'};
          color: ${isLight ? '#111' : '#fff'};
          transform: scale(1.05);
        }
        .ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        /* ── PDF scroll area ── */
        .reader-body {
          flex: 1;
          overflow-y: auto; overflow-x: hidden;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 72px 24px 100px;
          scroll-behavior: smooth;
          position: relative;
          overscroll-behavior: contain;
        }
        .reader-body::-webkit-scrollbar { width: 4px; }
        .reader-body::-webkit-scrollbar-thumb {
          background: ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'};
          border-radius: 2px;
        }

        /* ── Tap zone arrows (desktop) ── */
        .tap-zone-left, .tap-zone-right {
          position: absolute; top: 56px; bottom: 60px; width: 20%;
          z-index: 10; cursor: pointer; display: flex; align-items: center;
        }
        .tap-zone-left  { left: 0;  justify-content: flex-start; padding-left: 8px; }
        .tap-zone-right { right: 0; justify-content: flex-end;   padding-right: 8px; }

        .tap-arrow {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          background: ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'};
          color: ${isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'};
          opacity: 0;
          transition: opacity 0.3s, transform 0.2s;
        }
        .tap-zone-left:hover  .tap-arrow { opacity: 1; transform: translateX(-3px); }
        .tap-zone-right:hover .tap-arrow { opacity: 1; transform: translateX(3px); }

        /* ── Page wrapper ── */
        .page-wrapper {
          position: relative; border-radius: 4px; overflow: hidden;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.3),
            0 16px 48px rgba(0,0,0,0.35),
            0 40px 80px rgba(0,0,0,0.2);
          background: ${t.pageBg};
        }
        .page-wrapper.loading-page { opacity: 0.4; }

        /* Page turn animations */
        @keyframes slide-from-right {
          from { opacity: 0; transform: translateX(32px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slide-from-left {
          from { opacity: 0; transform: translateX(-32px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .page-wrapper.turn-right { animation: slide-from-right 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .page-wrapper.turn-left  { animation: slide-from-left  0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }

        /* ── Bottom bar ── */
        .reader-bottombar {
          position: absolute; bottom: 0; left: 0; right: 0;
          z-index: 50; height: 60px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(to top, ${t.bg}f0 60%, transparent);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .reader-bottombar.hidden {
          opacity: 0; pointer-events: none; transform: translateY(8px);
        }

        .bottom-inner {
          display: flex; align-items: center; gap: 8px;
          background: ${isLight ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.92)'};
          border: 1px solid ${borderColor};
          border-radius: 14px; padding: 8px 12px;
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }

        .page-nav-btn {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          color: ${subtleColor};
          background: transparent; cursor: pointer; font-size: 16px;
          transition: all 0.15s; border: none;
          user-select: none;
        }
        .page-nav-btn:hover:not(:disabled) {
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          color: ${isLight ? '#111' : '#fff'};
        }
        .page-nav-btn:active:not(:disabled) { transform: scale(0.9); }
        .page-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        .page-input-wrap { display: flex; align-items: center; gap: 6px; }

        .page-input {
          width: 42px; height: 34px; text-align: center;
          background: ${subtleBg};
          border: 1px solid ${borderColor};
          border-radius: 6px;
          color: ${isLight ? '#111' : '#fff'};
          font-size: 13px; font-family: ${monoFont}; font-weight: 500;
          outline: none; transition: border-color 0.2s;
          user-select: text; -webkit-user-select: text;
        }
        .page-input:focus { border-color: #3b82f6; }

        .page-separator {
          color: ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'};
          font-size: 12px; font-family: ${monoFont};
        }
        .page-total {
          color: ${isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'};
          font-size: 12px; font-family: ${monoFont}; min-width: 28px;
        }

        .divider-vertical {
          width: 1px; height: 20px;
          background: ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
          margin: 0 4px;
        }

        .progress-badge {
          font-size: 11px; font-family: ${monoFont}; font-weight: 500;
          color: #3b82f6;
          background: rgba(59,130,246,0.12);
          padding: 2px 8px; border-radius: 100px;
        }

        /* ── Settings panel ── */
        .settings-panel {
          position: absolute; top: 64px; right: 16px; width: 220px;
          background: ${isLight ? 'rgba(255,255,255,0.98)' : 'rgba(22,22,22,0.98)'};
          border: 1px solid ${borderColor};
          border-radius: 14px; padding: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          backdrop-filter: blur(20px);
          z-index: 200;
          animation: panel-in 0.2s ease;
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .settings-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'};
          margin-bottom: 8px; font-family: ${monoFont};
        }
        .settings-section { margin-bottom: 16px; }

        .theme-buttons { display: flex; gap: 6px; }
        .theme-btn {
          flex: 1; padding: 8px 4px; border-radius: 8px;
          font-size: 11px; font-family: ${monoFont};
          cursor: pointer; border: 1.5px solid transparent;
          transition: all 0.15s; text-align: center;
        }
        .theme-btn.active { border-color: #3b82f6; }

        .size-buttons { display: flex; gap: 4px; }
        .size-btn {
          flex: 1; padding: 8px 0; border-radius: 8px;
          font-family: ${serifFont}; cursor: pointer;
          border: 1.5px solid ${borderColor};
          background: ${subtleBg};
          color: ${subtleColor};
          transition: all 0.15s; text-align: center;
        }
        .size-btn.active {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.1);
          color: #3b82f6;
        }
        .size-btn:hover:not(.active) {
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          color: ${isLight ? '#111' : '#fff'};
        }

        .shortcut-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
        .shortcut-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-family: ${monoFont};
          color: ${isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)'};
        }
        .shortcut-key {
          background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'};
          border: 1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
          border-radius: 4px; padding: 1px 5px; font-size: 9px;
        }

        /* ── Saving indicator ── */
        .saving-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3b82f6;
          animation: pulse-dot 1.2s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }

        /* ── Loading skeleton ── */
        .skeleton-container {
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 16px;
        }
        .skeleton-spinner {
          width: 32px; height: 32px;
          border: 2px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton-label {
          font-size: 12px; font-family: ${monoFont};
          color: ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'};
          letter-spacing: 0.06em;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .reader-topbar { padding: 0 12px; }
          .reader-title  { display: none; }
          .reader-body   { padding: 64px 8px 80px; }
          .bottom-inner  { padding: 6px 8px; gap: 4px; }
          .settings-panel { right: 8px; left: 8px; width: auto; }
          .tap-zone-left, .tap-zone-right { display: none; }
        }
      `}</style>

      <div
        className="reader-root"
        onMouseMove={handleMouseMove}
        onClick={handleBodyClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Progress strip */}
        <div className="reader-progress">
          <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* ── Top bar ── */}
        <div
          className={`reader-topbar ${!uiVisible ? 'hidden' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <a href={`/dashboard/books/${bookId}`} className="reader-back">
            ← Kembali
          </a>

          <span className="reader-title">{bookTitle}</span>

          <div className="reader-controls">
            {saving && <div className="saving-dot" title="Menyimpan…" />}

            <button
              className="ctrl-btn"
              onClick={zoomOut}
              disabled={scale === 'sm'}
              title="Perkecil (-)"
            >
              <span style={{ fontFamily: monoFont, fontSize: 16 }}>A₋</span>
            </button>

            <button
              className="ctrl-btn"
              onClick={zoomIn}
              disabled={scale === 'xl'}
              title="Perbesar (+)"
            >
              <span style={{ fontFamily: monoFont, fontSize: 16 }}>A₊</span>
            </button>

            <button className="ctrl-btn" onClick={cycleTheme} title={`Tema: ${t.label}`}>
              {theme === 'dark' ? '🌙' : theme === 'sepia' ? '☕' : '☀️'}
            </button>

            <button
              className="ctrl-btn"
              title="Pengaturan & Pintasan"
              onClick={e => {
                e.stopPropagation()
                setSettingsOpen(s => !s)
                setUiVisible(true)
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
              }}
            >
              ⚙
            </button>
          </div>
        </div>

        {/* ── Settings panel ── */}
        {settingsOpen && (
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            {/* Theme */}
            <div className="settings-section">
              <div className="settings-section-label">Tema</div>
              <div className="theme-buttons">
                {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([k, v]) => (
                  <button
                    key={k}
                    className={`theme-btn ${theme === k ? 'active' : ''}`}
                    style={{
                      background: v.bg,
                      color: v.text,
                      borderColor: theme === k ? '#3b82f6' : 'transparent',
                    }}
                    onClick={() => setTheme(k)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="settings-section">
              <div className="settings-section-label">Ukuran</div>
              <div className="size-buttons">
                {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((k, idx) => (
                  <button
                    key={k}
                    className={`size-btn ${scale === k ? 'active' : ''}`}
                    style={{ fontSize: [11, 13, 15, 17][idx] }}
                    onClick={() => setScale(k)}
                  >
                    {['S', 'M', 'L', 'XL'][idx]}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="settings-section" style={{ marginBottom: 0 }}>
              <div className="settings-section-label">Pintasan</div>
              <div className="shortcut-list">
                {[
                  { keys: ['→', 'Space'], desc: 'Halaman berikut' },
                  { keys: ['←'],          desc: 'Halaman sebelum' },
                  { keys: ['+', '-'],     desc: 'Zoom in / out' },
                  { keys: ['Home', 'End'], desc: 'Awal / akhir' },
                ].map(row => (
                  <div key={row.desc} className="shortcut-row">
                    {row.keys.map(k => <span key={k} className="shortcut-key">{k}</span>)}
                    <span style={{ marginLeft: 2 }}>{row.desc}</span>
                  </div>
                ))}
                <div className="shortcut-row" style={{
                  marginTop: 6,
                  borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                  paddingTop: 6,
                }}>
                  <span style={{ fontSize: 12 }}>👆</span>
                  <span>Geser kiri/kanan untuk berpindah</span>
                </div>
                <div className="shortcut-row">
                  <span style={{ fontSize: 12 }}>🤏</span>
                  <span>Cubit untuk zoom</span>
                </div>
                <div className="shortcut-row">
                  <span style={{ fontSize: 12 }}>👆👆</span>
                  <span>Ketuk 2× untuk zoom</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tap zones (desktop hover arrows) ── */}
        <div
          className="tap-zone-left"
          style={{ pointerEvents: currentPage > 1 ? 'all' : 'none' }}
          onClick={e => { e.stopPropagation(); changePage(currentPage - 1, 'left') }}
        >
          <div className="tap-arrow">‹</div>
        </div>
        <div
          className="tap-zone-right"
          style={{ pointerEvents: currentPage < numPages ? 'all' : 'none' }}
          onClick={e => { e.stopPropagation(); changePage(currentPage + 1, 'right') }}
        >
          <div className="tap-arrow">›</div>
        </div>

        {/* ── PDF body ── */}
        <div
          ref={containerRef}
          className="reader-body"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={e => e.stopPropagation()}
          onDoubleClick={handleDoubleTap}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={err => console.error('PDF load error:', err)}
            loading={
              <div className="skeleton-container" style={{ width: pageWidth, minHeight: 500 }}>
                <div className="skeleton-spinner" />
                <div className="skeleton-label">Memuat dokumen…</div>
              </div>
            }
            error={
              <div className="skeleton-container" style={{ width: pageWidth, minHeight: 400 }}>
                <div style={{ fontSize: 40 }}>📄</div>
                <div className="skeleton-label" style={{ color: '#ef4444' }}>Gagal memuat PDF</div>
              </div>
            }
          >
            <div
              className={[
                'page-wrapper',
                !pageLoaded ? 'loading-page' : '',
                pageLoaded && turnDir ? `turn-${turnDir}` : '',
              ].filter(Boolean).join(' ')}
              style={{ background: t.pageBg }}
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                onRenderSuccess={() => setPageLoaded(true)}
                loading={
                  <div style={{
                    width: pageWidth,
                    height: pageWidth * 1.414,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: t.pageBg,
                  }}>
                    <div className="skeleton-spinner" />
                  </div>
                }
              />
            </div>
          </Document>
        </div>

        {/* ── Bottom navigation bar ── */}
        <div
          className={`reader-bottombar ${!uiVisible ? 'hidden' : ''}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="bottom-inner">
            {/* First page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(1, 'left')}
              disabled={currentPage === 1}
              title="Halaman pertama (Home)"
              style={{ fontSize: 12, width: 28 }}
            >⏮</button>

            {/* Previous page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(currentPage - 1, 'left')}
              disabled={currentPage === 1}
              title="Sebelumnya (←)"
            >‹</button>

            {/* Go-to-page input */}
            <form onSubmit={handleGoTo} className="page-input-wrap">
              <input
                className="page-input"
                type="number"
                value={goToInput}
                onChange={e => setGoToInput(e.target.value)}
                placeholder={String(currentPage)}
                min={1}
                max={numPages}
                onFocus={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }}
                onBlur={resetHideTimer}
                onClick={e => e.stopPropagation()}
              />
              <span className="page-separator">/</span>
              <span className="page-total">{numPages || '…'}</span>
            </form>

            <div className="divider-vertical" />
            <span className="progress-badge">{Math.round(progress)}%</span>
            <div className="divider-vertical" />

            {/* Next page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(currentPage + 1, 'right')}
              disabled={currentPage === numPages}
              title="Berikutnya (→)"
            >›</button>

            {/* Last page */}
            <button
              className="page-nav-btn"
              onClick={() => changePage(numPages, 'right')}
              disabled={currentPage === numPages}
              title="Halaman terakhir (End)"
              style={{ fontSize: 12, width: 28 }}
            >⏭</button>
          </div>
        </div>
      </div>
    </>
  )
}