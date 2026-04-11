import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function proxy(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    const pathname = req.nextUrl.pathname

    // Jika akun nonaktif
    if (token && token.is_active === false) {
      return NextResponse.redirect(new URL('/auth/inactive', req.url))
    }

    // Proteksi admin
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Route publik — tidak butuh login
        const publicRoutes = [
          '/books',
          '/auth/login',
          '/auth/register',
          '/auth/activate',
          '/auth/reset-password',
          '/auth/inactive',
        ]

        // Cek apakah path dimulai dengan route publik
        const isPublic = publicRoutes.some(
          (route) => pathname === route || pathname.startsWith(route + '/')
        )

        if (isPublic) return true

        // API publik untuk buku
        if (pathname.startsWith('/api/public/')) return true

        // Semua route lain butuh token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/books/:path*',
    '/api/public/:path*',
  ],
}