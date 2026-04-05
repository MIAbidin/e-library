import Link from 'next/link'

export default function InactivePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Akun Dinonaktifkan
        </h1>
        <p className="text-gray-500 mb-6">
          Akun Anda saat ini tidak aktif. Silakan hubungi Administrator
          IT untuk mengaktifkan kembali akun Anda.
        </p>
        <Link
          href="/auth/login"
          className="text-blue-600 hover:underline text-sm"
        >
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  )
}