import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResetPasswordForm from './ResetPasswordForm'

interface PageProps {
  searchParams: { token?: string }
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const token = searchParams.token
  if (!token) redirect('/auth/login')

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('reset_token', token)
    .gt('reset_token_expires', new Date().toISOString())
    .single()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
        flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Kadaluarsa</h1>
          <p className="text-gray-500 text-sm mb-6">
            Link reset password ini sudah tidak valid. Minta Administrator untuk kirim ulang.
          </p>
          <a href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl
              text-sm font-medium hover:bg-blue-700 transition">
            Kembali ke Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
      flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14
            bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Buat Password Baru</h1>
          <p className="text-sm text-gray-500 mt-1">
            Untuk akun <span className="text-blue-600 font-medium">{user.email}</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ResetPasswordForm token={token} userId={user.id} />
        </div>
      </div>
    </div>
  )
}