import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'
import Link from 'next/link'

export default async function RegisterPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
      flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14
            bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-2xl">📚</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">E-Library Perusahaan</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform perpustakaan digital internal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Buat Akun Baru</h2>
          <p className="text-sm text-gray-500 mb-6">
            Daftarkan diri menggunakan email perusahaan Anda.
          </p>
          <RegisterForm />
        </div>

        {/* Link ke login */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Masuk di sini
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} E-Library Perusahaan. Confidential.
        </p>
      </div>
    </div>
  )
}