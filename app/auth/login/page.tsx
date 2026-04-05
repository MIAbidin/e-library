import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
      flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16
            bg-blue-600 rounded-2xl mb-3 lg:mb-4 shadow-lg">
            <span className="text-2xl lg:text-3xl">📚</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            E-Library Perusahaan
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Platform perpustakaan digital internal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-800 mb-5 lg:mb-6">
            Masuk ke Akun Anda
          </h2>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Link register */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Belum punya akun?{' '}
          <Link href="/auth/register"
            className="text-blue-600 hover:underline font-medium">
            Daftar sekarang
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} E-Library Perusahaan. Confidential.
        </p>
      </div>
    </div>
  )
}