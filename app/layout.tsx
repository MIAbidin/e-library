import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ToastContainer } from '@/components/ui/Toast'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'E-Library Perusahaan',
  description: 'Platform perpustakaan digital internal perusahaan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('elib-theme');
                document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
              } catch(e) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            `,
          }}
        />
      </head>
      <body className={sora.variable}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}