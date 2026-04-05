'use client'

import { useEffect } from 'react'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'

export function MobileDrawer({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()

  // Lock scroll saat drawer terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Tutup dengan ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [close])

  return (
    <>
      {/* Backdrop — hanya di mobile */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}