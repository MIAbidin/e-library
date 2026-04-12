// app/dashboard/books/[id]/read/layout.tsx
//
// PENTING: Layout ini HARUS me-override app/dashboard/layout.tsx
// Caranya: return children langsung tanpa wrapper apapun.
// Header & sidebar dashboard TIDAK boleh muncul di halaman baca.
//
// Next.js App Router: nested layout mewarisi parent layout.
// Untuk "escape" dari dashboard layout, kita set overflow:hidden
// di <html>/<body> via inline style di sini, dan pastikan reader-root
// menggunakan position:fixed inset:0 z-index:99999 sehingga
// MENUTUPI seluruh elemen dashboard di bawahnya.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

export default async function ReadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  return (
    <>
      {/* 
        Inject global style to hide dashboard chrome.
        PDFViewer uses position:fixed inset:0 z-index:99999
        which already covers everything, but this also hides
        scroll artifacts from the dashboard layout.
      */}
      <style>{`
        /* Hide dashboard layout elements when reader is active */
        body > * { overflow: hidden !important; }
        html, body {
          overflow: hidden !important;
          height: 100% !important;
        }
      `}</style>
      {children}
    </>
  )
}