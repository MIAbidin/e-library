import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

// Jika sudah login → redirect ke dashboard/admin
// Jika belum login → redirect ke landing page
export default async function RootPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect(session.user.role === 'admin' ? '/admin' : '/dashboard')
  }

  // Redirect ke landing page
  redirect('/landing')
}